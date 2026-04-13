// ===== Password Parsing & Login Validation =====

var HypnoApp = window.HypnoApp || {};

/**
 * Look up tier info for a given package level
 */
HypnoApp.getTier = function(level) {
  var tier = HypnoApp.TIER_MAP.find(function(t) {
    return level >= t.minLevel && level <= t.maxLevel;
  });
  return tier || HypnoApp.TIER_MAP[0];
};

/**
 * Parse password.
 *
 * Finds "ly" in the password (may have leading characters), then parses:
 * ly{2-digit package level}{2-digit usage level}{3-digit XP}{4-digit usage count}{1-digit flag}{optional}
 *
 * Any format error returns generic "密码错误".
 */
HypnoApp.parsePassword = function(password) {
  if (!password || password.trim() === '') {
    return { valid: false, errorMessage: '密码错误' };
  }

  // Find "ly" anywhere in the password
  var lyIndex = password.indexOf('ly');
  if (lyIndex === -1) {
    return { valid: false, errorMessage: '密码错误' };
  }

  // Parse from the "ly" position
  var data = password.substring(lyIndex + 2);

  // Need at least 12 characters after "ly": 2+2+3+4+1
  if (data.length < 12 || !/^\d{12}/.test(data)) {
    return { valid: false, errorMessage: '密码错误' };
  }

  var pkgLevel = parseInt(data.substring(0, 2), 10);
  var usageLevel = parseInt(data.substring(2, 4), 10);
  var xp = parseInt(data.substring(4, 7), 10);
  var usageCount = parseInt(data.substring(7, 11), 10);
  var flag = data.substring(11, 12);

  return {
    valid: true,
    packageLevel: pkgLevel,
    usageLevel: usageLevel,
    xp: xp,
    usageCount: usageCount,
    verboseError: flag !== '0',
    errorMessage: null,
  };
};

/**
 * Validate login: check username + password, return session or error
 */
HypnoApp.validateLogin = function(username, password) {
  var parsed = HypnoApp.parsePassword(password);

  if (!parsed.valid) {
    return { valid: false, errorMessage: '密码错误' };
  }

  var trimmedUsername = (username || '').trim();
  if (!trimmedUsername) {
    return { valid: false, errorMessage: '请输入用户名' };
  }

  var tier = HypnoApp.getTier(parsed.packageLevel);
  var nextLevelXP = HypnoApp.getNextLevelXP(parsed.usageLevel);

  return {
    valid: true,
    errorMessage: null,
    session: Object.freeze({
      username: trimmedUsername,
      packageLevel: parsed.packageLevel,
      usageLevel: parsed.usageLevel,
      xp: parsed.xp,
      usageCount: parsed.usageCount,
      verboseError: parsed.verboseError,
      tierName: tier.name,
      tierNameEn: tier.nameEn,
      tierColor: tier.color,
      tierIcon: tier.icon,
      maxUsage: tier.maxUsage,
      nextLevelXP: nextLevelXP,
    }),
  };
};

window.HypnoApp = HypnoApp;
