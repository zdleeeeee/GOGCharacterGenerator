// models.js - 角色数据结构
class Character {
  static categoryMappings = {
    // 属性（技能）映射
    '职业': 'PRF',
    '力量': 'STR',
    '敏捷': 'DEX',
    '智慧': 'INT',
    '魅力': 'CHA',
    '感知': 'WIS',
    '法力': 'MAG',
    // 物品类别映射
    '装备': 'equipment',
    '食物': 'food',
    '钱币': 'currency',
    '医疗物品': 'medical',
    '药剂': 'potions',
    '储备/其他物品': 'supplies',
    // 反向映射
    'PRF': '职业',
    'STR': '力量',
    'DEX': '敏捷',
    'INT': '智慧',
    'CHA': '魅力',
    'WIS': '感知',
    'MAG': '法力',
    'equipment': '装备',
    'food': '食物',
    'currency': '钱币',
    'medical': '医疗物品',
    'potions': '药剂',
    'supplies': '储备/其他物品'
  };
  static standardSkillsStructure = {
    PRF: [], // 职业类技能
    STR: [], // 力量类技能
    DEX: [], // 敏捷类技能
    INT: [], // 智慧类技能
    CHA: [], // 魅力类技能
    WIS: [], // 感知类技能
    MAG: []  // 法力类技能
  };
  constructor(data = {}) {
    if (data.id !== undefined && data.id !== null) {
      this.id = data.id;
    }
    this.name = data.name || '未命名角色';
    this.portrait = data.portrait || null;
    this.player = data.player || '';
    this.gender = data.gender || '未知';

    this.blessing = data.blessing || '';
    this.blessingFullName = data.blessingFullName || '';
    this.blessinglevel = data.blessinglevel || 0;
    this.blessingSystem = data.blessingSystem || [
      { level: '', attribute: '', skill: '', corruption: '' },
      { level: '', attribute: '', skill: '', corruption: '' },
      { level: '', attribute: '', skill: '', corruption: '' }
    ];  // 赐福系统数据结构
    this.blessingSkills = data.blessingSkills || Array(5).fill().map(() => ({
      name: '',
      description: ''
    }));  // 权柄特技数据结构
    this.soul = data.soul || 0;

    this.age = data.age || 1;
    this.alignment = data.alignment || '守序善良';
    this.nationality = data.nationality || '';
    this.class = data.class || '';  // 职业
    this.description = data.description || '';
    this.isGod = data.isGod || '';  // 身份
    this.attributes = data.attributes || {
      STR: { base: 5, statusAdj: 0, blessingAdj: 0 },
      DEX: { base: 5, statusAdj: 0, blessingAdj: 0 },
      INT: { base: 5, statusAdj: 0, blessingAdj: 0 },
      CHA: { base: 5, statusAdj: 0, blessingAdj: 0 },
      WIS: { base: 5, statusAdj: 0, blessingAdj: 0 },
      MAG: { base: 5, statusAdj: 0, blessingAdj: 0 },

      HP: { base: 10, current: 10 },
      MP: { base: 10, current: 10 }
    };

    this.status = data.status || [];
    this.skills = data.skills || {
      PRF: [], // 职业类技能
      STR: [], // 力量类技能
      DEX: [], // 敏捷类技能
      INT: [], // 智慧类技能
      CHA: [], // 魅力类技能
      WIS: [], // 感知类技能
      MAG: []  // 法力类技能
    };
    this.equipment = data.equipment || [];
    this.inventory = data.inventory || {
      equipment: [],    // 装备
      food: [],         // 食物
      currency: [],     // 钱币
      medical: [],      // 医疗物品
      potions: [],      // 药剂
      supplies: []      // 储备/其他物品
    };
    this.logs = data.logs || [];
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }
}
