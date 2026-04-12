// ===== Password Parsing & Login Validation =====

var HypnoApp = window.HypnoApp || {};

/**
 * Look up tier info for a given level
 */
HypnoApp.getTier = function(level) {
  var tier = HypnoApp.TIER_MAP.find(function(t) {
    return level >= t.minLevel && level <= t.maxLevel;
  });
  return tier || HypnoApp.TIER_MAP[0];
};

/**
 * Parse password with progressive validation.
 *
 * Format: ly{2-digit level}{4-digit usage}{1-digit verbose flag}{optional suffix}
 *
 * Verbose flag logic:
 * - If password is too malformed to extract the flag, default to verbose (detailed errors)
 * - If flag = 1: show specific error messages
 * - If flag = 0: show generic "密码错误"
 */
HypnoApp.parsePassword = function(password) {
  // Empty password
  if (!password || password.trim() === '') {
    return { valid: false, verboseError: true, errorMessage: '请输入访问密钥' };
  }

  // Check prefix
  if (!password.startsWith('ly')) {
    return { valid: false, verboseError: true, errorMessage: '访问密钥格式无效' };
  }

  // Extract level (positions 2-3)
  var levelStr = password.substring(2, 4);
  if (levelStr.length < 2 || !/^\d{2}$/.test(levelStr)) {
    return { valid: false, verboseError: true, errorMessage: '等级编码异常' };
  }

  // Extract usage count (positions 4-7)
  var usageStr = password.substring(4, 8);
  if (usageStr.length < 4 || !/^\d{4}$/.test(usageStr)) {
    return { valid: false, verboseError: true, errorMessage: '使用数据异常' };
  }

  // Extract verbose flag (position 8)
  var flagStr = password.substring(8, 9);
  if (flagStr.length < 1 || !/^\d$/.test(flagStr)) {
    return { valid: false, verboseError: true, errorMessage: '密钥配置位缺失' };
  }

  // Password format is valid
  return {
    valid: true,
    level: parseInt(levelStr, 10),
    usageCount: parseInt(usageStr, 10),
    verboseError: flagStr !== '0',
    errorMessage: null,
  };
};

/**
 * Validate login: check username + password, return session or error
 */
HypnoApp.validateLogin = function(username, password) {
  var parsed = HypnoApp.parsePassword(password);

  // Password parsing failed
  if (!parsed.valid) {
    return {
      valid: false,
      errorMessage: parsed.verboseError ? parsed.errorMessage : '密码错误',
    };
  }

  // Check username
  var trimmedUsername = (username || '').trim();
  if (!trimmedUsername) {
    return {
      valid: false,
      errorMessage: parsed.verboseError ? '请输入用户名' : '密码错误',
    };
  }

  // All valid — build session
  var tier = HypnoApp.getTier(parsed.level);

  return {
    valid: true,
    errorMessage: null,
    session: Object.freeze({
      username: trimmedUsername,
      level: parsed.level,
      usageCount: parsed.usageCount,
      verboseError: parsed.verboseError,
      tierName: tier.name,
      tierNameEn: tier.nameEn,
      tierColor: tier.color,
      maxUsage: tier.maxUsage,
    }),
  };
};

window.HypnoApp = HypnoApp;
