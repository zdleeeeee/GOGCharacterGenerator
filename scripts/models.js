// models.js - 角色数据结构
class Character {
  constructor(data = {}) {
    if (data.id !== undefined && data.id !== null) {
      this.id = data.id;
    }
    this.name = data.name || '未命名角色';
    this.portrait = data.portrait || null;
    this.player = data.player || '';
    this.gender = data.gender || '未知';

    this.blessing = data.blessing || '';
    this.blessinglevel = data.blessinglevel || 1;
    this.blessingSystem = data.blessingSystem || [
      { level: 1, attribute: '', bonus: 0, skill: '', soulWear: 0, corruption: '' },
      { level: 2, attribute: '', bonus: 0, skill: '', soulWear: 0, corruption: '' },
      { level: 3, attribute: '', bonus: 0, skill: '', soulWear: 0, corruption: '' },
      { level: 4, attribute: '', bonus: 0, skill: '', soulWear: 0, corruption: '' },
      { level: 5, attribute: '', bonus: 0, skill: '', soulWear: 0, corruption: '' }
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
    this.attributes = data.attributes || {
      STR: { base: 5, statusAdj: 0, blessingAdj: 0 },
      DEX: { base: 5, statusAdj: 0, blessingAdj: 0 },
      INT: { base: 5, statusAdj: 0, blessingAdj: 0 },
      CHA: { base: 5, statusAdj: 0, blessingAdj: 0 },
      WIS: { base: 5, statusAdj: 0, blessingAdj: 0 },
      MAG: { base: 5, statusAdj: 0, blessingAdj: 0 },

      HP: { base: 5, current: 5 },
      MP: { base: 5, current: 5 }
    };

    this.status = data.status || [];
    this.skills = data.skills || {
      STR: [], // 力量类技能
      DEX: [], // 敏捷类技能
      INT: [], // 智慧类技能
      CHA: [], // 魅力类技能
      WIS: [], // 感知类技能
      MAG: []  // 法力类技能
    };
    this.equipment = data.equipment || [];
    this.inventory = data.inventory || [];
    this.logs = data.logs || [];
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }
}
