// data.js - 静态数据
window.staticData = {
    blessings: [
        {
            name: "延续",
            system: [
                { level: 1, attribute: "力量/法力", bonus: 2, skill: "源流之水", soulWear: 1, corruption: '具鳞之子' },
                { level: 2, attribute: "力量/法力/敏捷", bonus: 4, skill: "源流之水/白蛇之子", soulWear: 2, corruption: '具鳞之子' },
                { level: 3, attribute: "力量/法力/敏捷", bonus: 6, skill: "源流之水/白蛇之子/水即吾身", soulWear: 4, corruption: '续尾之子' },
                { level: 4, attribute: "力量/法力/敏捷/健康", bonus: 8, skill: "源流之水/白蛇之子/水即吾身/归还源流", soulWear: 8, corruption: '续尾之子' },
                { level: 5, attribute: "力量/法力/敏捷/健康", bonus: 10, skill: "源流之水/白蛇之子/水即吾身/归还源流/吾将“延续”", soulWear: 16, corruption: '源化蛇嗣' }
            ],
            skills: [
                { name: "源流之水", description: "该特技持续期间，角色所施展的水系魔法/治愈类法术效果+2X。" },
                { name: "白蛇之子", description: "该特技持续期间，角色的力量/敏捷属性额外+X（不计上限）；健康上限同步+2X（特技结束后恢复原先健康值）。" },
                { name: "水即吾身", description: "通过接触场景中可取得的清洁水源（包括角色用水魔法凝聚的大气水分），为自身恢复至多5X点健康。" },
                { name: "归还源流", description: "该特技持续期间，角色身躯完全液化（视作清水，可与外界的水流融为一体而移动），免疫外界伤害，自然恢复2X点健康（视作瞬间发生），同时法力属性额外+X（不计上限）。" },
                { name: "吾将“延续”", description: "作为其他角色所认可的“上级”（如队长）时，可将自身任意X项属性的基础属性值（含健康）“延续”给至多X名角色；使其在特技生效期间，能以等同于赐福者的能力（无论高低）进行相关属性的鉴定。特技结束后，被延续者的各项属性自然还原（若为濒死者，健康值恢复至1）。" }
            ]
        },
        // 更多权柄...
    ],

    skills: {
        "通用魔攻": [
            { name: "火焰箭", class: "法师", description: "发射一支火焰箭" },
            
        ],
        "通用物攻": [
            { name: "刀剑精通", class: "战士", description: "ddd" }
        ],
        "通用肉功": [
            { name: "拳击", class: "战士", description: "拳击伤害增加" }
        ],
        "通用治疗": [
            { name: "初级治疗", class: "牧师", description: "恢复少量生命值" }
        ],
        
        "通用辅助": [
            { name: "隐身术", class: "游侠", description: "暂时隐藏身形" }
        ]
        // 更多技能...
    },

    equipments: {
        "刀剑": [
            { name: "普通大剑", type: "大剑", modifier: "eee", description: "eee" }
        ],
        "枪械": [
            { name: "普通魔动枪", type: "魔动枪", modifier: "", description: ""}
        ],
        "法器": [
            { name: "麟笏", type: "礼器", modifier: "", description: "迦南人用于祭祀的礼器"},
            { name: "福带", type: "礼器", modifier: "", description: "迦南人传统丝织品，用于祭祀的礼器"},
            { name: "福神杖", type: "礼器", modifier: "", description: "迦南人用于祭祀的礼器，大致造型为一根由蛇盘绕的木杖"}
        ]
    },

    inventory: {
        "食物": [
            { name: "米饭", weight: 0.5, description: "可以消除一点饥饿值" }
        ]
    }
};