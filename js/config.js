// ===== Constants & Configuration =====

var HypnoApp = window.HypnoApp || {};

HypnoApp.APP_VERSION = 'v4.2.1';

// Password format: ly + 2-digit package level + 2-digit usage level + 3-digit XP + 4-digit usage count + 1-digit verbose flag + optional suffix
HypnoApp.PASSWORD_REGEX = /^ly(\d{2})(\d{2})(\d{3})(\d{4})(\d)(.*)?$/;

// Tier definitions: package level range -> max usage, name, color
HypnoApp.TIER_MAP = Object.freeze([
  { minLevel: 0,  maxLevel: 0,  maxUsage: 5,    name: '体验用户', nameEn: 'Trial',        color: 'var(--tier-trial)',        icon: 'fa-solid fa-seedling' },
  { minLevel: 1,  maxLevel: 3,  maxUsage: 20,   name: '初级套餐', nameEn: 'Basic',        color: 'var(--tier-basic)',        icon: 'fa-solid fa-shield' },
  { minLevel: 4,  maxLevel: 6,  maxUsage: 50,   name: '标准套餐', nameEn: 'Standard',     color: 'var(--tier-standard)',     icon: 'fa-solid fa-star' },
  { minLevel: 7,  maxLevel: 9,  maxUsage: 100,  name: '进阶套餐', nameEn: 'Advanced',     color: 'var(--tier-advanced)',     icon: 'fa-solid fa-bolt' },
  { minLevel: 10, maxLevel: 14, maxUsage: 200,  name: '高级套餐', nameEn: 'Professional', color: 'var(--tier-professional)', icon: 'fa-solid fa-gem' },
  { minLevel: 15, maxLevel: 19, maxUsage: 500,  name: '超级套餐', nameEn: 'Expert',       color: 'var(--tier-expert)',       icon: 'fa-solid fa-fire' },
  { minLevel: 20, maxLevel: 99, maxUsage: 9999, name: '至尊套餐', nameEn: 'Master',       color: 'var(--tier-master)',       icon: 'fa-solid fa-crown' },
]);

/**
 * Calculate XP needed to reach next usage level.
 * Formula: (currentLevel + 1) * 100, capped at 999.
 */
HypnoApp.getNextLevelXP = function(usageLevel) {
  return Math.min((usageLevel + 1) * 100, 999);
};

// Default slider settings
HypnoApp.DEFAULT_SETTINGS = Object.freeze({
  delay: 3,
  intensity: 5,
  obedienceDepth: 3,
  sensitivity: 50,
  resistance: 30,
  duration: 60,
});

// Obedience depth labels (index 0 = value 1)
HypnoApp.DEPTH_LABELS = Object.freeze([
  '轻度', '中度', '深层', '极深', '绝对'
]);

// Intensity -> animation speed mapping
HypnoApp.INTENSITY_LEVELS = Object.freeze([
  { minIntensity: 1,  maxIntensity: 3,  heartbeatSpeed: '1.5s', expandSpeed: '2.5', rotationSpeed: '4s',   saturation: 0.6,  label: '低' },
  { minIntensity: 4,  maxIntensity: 6,  heartbeatSpeed: '1.2s', expandSpeed: '1.6', rotationSpeed: '2.5s', saturation: 0.8,  label: '中' },
  { minIntensity: 7,  maxIntensity: 9,  heartbeatSpeed: '0.8s', expandSpeed: '1.0', rotationSpeed: '1.5s', saturation: 1.0,  label: '高' },
  { minIntensity: 10, maxIntensity: 10, heartbeatSpeed: '0.6s', expandSpeed: '0.6', rotationSpeed: '1s',   saturation: 1.2,  label: '极限' },
]);

// Blackout phase text sequence
HypnoApp.BLACKOUT_MESSAGES = Object.freeze([
  '正在初始化...',
  '校准参数中...',
  '即将开始...',
]);

// Mode definitions
HypnoApp.MODES = Object.freeze([
  {
    key: 'hypnosis',
    name: '催眠',
    icon: 'fa-solid fa-spiral',
    fallbackIcon: 'fa-solid fa-hurricane',
    description: '通过视觉与听觉引导，使目标进入深度催眠状态，逐步丧失自主意识，完全服从控制者的指令。',
    details: [
      '作用原理：利用螺旋视觉焦点与节律性暗示波，逐步瓦解目标的意识防线',
      '核心效果：意识模糊、注意力锁定、暗示接受度大幅提升',
      '持续时间：根据服从深度设定，通常持续30分钟至数小时',
      '副作用：轻微头晕、短暂记忆模糊（均为可逆性反应）',
      '适用场景：标准催眠控制、行为指令植入、意识重写',
    ],
  },
  {
    key: 'arousal',
    name: '发情',
    icon: 'fa-solid fa-heart-pulse',
    fallbackIcon: 'fa-solid fa-heart-pulse',
    description: '激活目标的生理敏感区域神经回路，持续释放兴奋性暗示波，使目标陷入无法抑制的强烈渴望状态。',
    details: [
      '作用原理：定向刺激下丘脑-边缘系统回路，强制激活多巴胺与催产素分泌通路',
      '核心效果：体温上升、感官超敏化、理性判断力急剧下降、强烈的生理渴望',
      '强度分级：微热（可忍耐）→ 潮红（难以抑制）→ 失控（完全支配）',
      '持续时间：根据暗示强度设定，效果在停止后15-60分钟内逐渐消退',
      '特殊说明：高强度模式下目标可能出现无意识的肢体反应，建议配合拘束模式使用',
    ],
  },
  {
    key: 'restraint',
    name: '拘束',
    icon: 'fa-solid fa-link',
    fallbackIcon: 'fa-solid fa-link',
    description: '通过精神锁定指令封锁目标的运动神经通路，使其身体部分或完全丧失自主活动能力。',
    details: [
      '作用原理：向运动皮层发送抑制性信号，阻断自主运动指令的传导',
      '核心效果：肢体僵直、无法移动、语言功能可选择性保留或封锁',
      '拘束等级：局部（仅四肢）→ 全身（颈部以下）→ 完全（含面部表情与发声）',
      '持续时间：精神拘束可即时解除，无物理束缚残留',
      '安全机制：保留自主呼吸与心跳等基础生命功能，不影响生理安全',
    ],
  },
  {
    key: 'mindRewrite',
    name: '常识改变',
    icon: 'fa-solid fa-brain',
    fallbackIcon: 'fa-solid fa-brain',
    description: '深层介入目标的认知框架，重写其对特定事物的基础认知与常识判断，使目标从根本上改变对现实的理解。',
    details: [
      '作用原理：绕过意识层直接作用于深层记忆与认知图式，植入替代性认知框架',
      '核心效果：目标将"新常识"视为理所当然的事实，无法察觉认知被篡改',
      '改写范围：单一概念 → 行为准则 → 人际关系认知 → 世界观重构',
      '稳定性：低强度改写可自然恢复；高强度改写需主动解除指令',
      '注意事项：认知冲突过大时目标可能出现短暂困惑，建议循序渐进地改写',
    ],
  },
]);

// Slider configuration for rendering
HypnoApp.SLIDER_CONFIG = Object.freeze([
  {
    key: 'delay',
    label: '催眠诱导延迟',
    icon: 'fa-hourglass-half',
    description: '催眠序列启动前的等待时间',
    min: 1, max: 10, step: 1,
    format: function(v) { return v + '秒'; },
    details: [
      '功能说明：控制催眠序列正式启动前的准备时间，期间屏幕显示初始化动画',
      '低延迟（1-3秒）：快速启动，适合目标已处于放松或顺从状态时使用',
      '中延迟（4-6秒）：标准设定，给予目标适度的心理准备时间，提升暗示接受度',
      '高延迟（7-10秒）：缓慢渐入，通过延长等待制造紧张感与期待感，增强催眠效果',
      '建议：首次使用建议设置3-5秒，根据目标反应逐步调整',
    ],
  },
  {
    key: 'duration',
    label: '催眠持续时间',
    icon: 'fa-clock',
    description: '催眠动画的自动持续时长，到时间后自动退出',
    min: 30, max: 300, step: 10,
    format: function(v) {
      var m = Math.floor(v / 60);
      var s = v % 60;
      return m > 0 ? (m + '分' + (s > 0 ? s + '秒' : '')) : (s + '秒');
    },
    details: [
      '功能说明：设定催眠动画的自动持续时长，到达设定时间后动画将自动结束并返回控制面板',
      '短时催眠（30-60秒）：快速暗示植入，适合简单指令或强化已有暗示',
      '标准催眠（70-120秒）：常规催眠时长，足够完成中等复杂度的意识引导',
      '深度催眠（130-200秒）：长时间持续暗示，适合深层意识改写或复杂行为模式植入',
      '超长催眠（210-300秒）：极限催眠时长，用于彻底瓦解精神防线或完整的认知重构',
    ],
  },
  {
    key: 'intensity',
    label: '暗示强度',
    icon: 'fa-bolt',
    description: '催眠暗示波的作用力度',
    min: 1, max: 10, step: 1,
    format: function(v) { return v + '/10'; },
    details: [
      '功能说明：控制催眠视觉效果的整体强度，影响螺旋旋转速度、心跳频率和色彩饱和度',
      '低强度（1-3）：螺旋缓慢旋转（8秒/圈），心跳柔和（1.5秒/拍），色彩淡雅，适合轻度放松',
      '中强度（4-6）：螺旋中速旋转（5秒/圈），心跳稳定（1.2秒/拍），色彩正常，标准催眠效果',
      '高强度（7-9）：螺旋快速旋转（3秒/圈），心跳加速（0.8秒/拍），色彩鲜艳，深度催眠',
      '极限强度（10）：螺旋极速旋转（2秒/圈），心跳急促（0.6秒/拍），色彩过饱和，最大催眠效果',
    ],
  },
  {
    key: 'obedienceDepth',
    label: '服从深度',
    icon: 'fa-hurricane',
    description: '目标精神顺从的程度等级',
    min: 1, max: 5, step: 1,
    format: function(v) { return HypnoApp.DEPTH_LABELS[v - 1]; },
    details: [
      '轻度（等级1）：目标保留大部分自主意识，仅对简单的直接指令产生顺从倾向',
      '中度（等级2）：目标意识开始模糊，对大多数指令自然服从，但仍可抗拒强烈违背本意的命令',
      '深层（等级3）：目标进入深度催眠态，主动思考能力大幅降低，几乎无条件接受所有指令',
      '极深（等级4）：目标完全丧失抵抗意志，行为完全由控制者指令驱动，可植入行为暗示',
      '绝对（等级5）：目标意识完全被压制，进入无我状态，任何指令都会被视为自身的意愿执行',
    ],
  },
  {
    key: 'sensitivity',
    label: '暗示敏感度',
    icon: 'fa-star-half-stroke',
    description: '对象的接受性增幅系数',
    min: 1, max: 100, step: 1,
    format: function(v) { return v + '%'; },
    details: [
      '功能说明：调节目标对催眠暗示的敏感程度增幅，数值越高目标越容易受到暗示影响',
      '低敏感度（1-30%）：目标对暗示的接受速度较慢，需要更长时间和更多重复才能生效',
      '中敏感度（31-60%）：标准增幅，暗示在合理时间内生效，适合大多数场景',
      '高敏感度（61-85%）：目标对暗示高度敏感，轻微的暗示即可产生显著效果',
      '超敏感（86-100%）：目标对任何暗示几乎立即响应，甚至非语言暗示也能产生强烈反应',
    ],
  },
  {
    key: 'resistance',
    label: '抵抗抑制',
    icon: 'fa-shield-halved',
    description: '精神抵抗力的抑制程度',
    min: 0, max: 100, step: 1,
    format: function(v) { return v + '%'; },
    details: [
      '功能说明：抑制目标自身的精神防御机制，降低其对催眠的天然抵抗力',
      '无抑制（0%）：保留目标全部精神防御，催眠效果取决于目标自身意志力',
      '低抑制（1-30%）：轻微削弱防御，目标仍能感知到催眠尝试，但抵抗动机减弱',
      '中抑制（31-60%）：显著削弱防御，目标难以主动对抗催眠暗示，但紧急情况下仍可挣脱',
      '高抑制（61-100%）：精神防御几乎完全被压制，目标无法感知到自己正在被催眠，也无力抵抗',
    ],
  },
]);

window.HypnoApp = HypnoApp;
