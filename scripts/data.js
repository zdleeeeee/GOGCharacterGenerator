// data.js - 静态数据
window.staticData = {
    blessings: [
        {
            name: "延续",
            fullName: "G001-延续-绵延之蛇-洼西吕福",
            system: [
                { level: '1~3', attribute: "力/法", skill: "概念亲和、红外视觉 ", corruption: '具鳞之子：皮肤浮现蛇鳞' },
                { level: '4~6', attribute: "力/法/敏", skill: "水即吾身、蜕皮新生", corruption: '续尾之子：下肢蛇尾化，双性征' },
                { level: '7~10', attribute: "力/法/敏/健", skill: "塑容、归还源流、延续链", corruption: '源化蛇嗣：头部蛇首化，可自由还原人形' },
            ],
            skills: [
                { name: "概念亲和", description: "（被动技能）延续的蒙福者对治愈、水相关的概念亲和，擅长相关知识点和能力。" },
                { name: "红外视觉", description: "获得蛇类的颊窝，拥有感知热量形成周围环境热成像的能力。" },
                { name: "水即吾身", description: "通过接触场景中可取得的清洁水源，为自身或他人恢复健康。" },
                { name: "蜕皮新生", description: "主动脱落外皮，清楚所有负面状态，一天限使用两次。" },
                { name: "塑容", description: "当环境存在清洁水源，可以利用水源改变自身的容貌和修复肢体，差异越大难度越高，水源越充足难度越低。" },
                { name: "归还源流", description: "当环境温度适宜，角色身躯完全液化为清水，可与外界的水流融为一体而快速移动，也可以用于潜行与窥探，免疫外界物理伤害，但也会造成交互受限，液化与复原均需进行成功判定。" },
                { name: "延续链", description: "当自己与他人之间存在上下级的关系时，可以向下级“延续”自己的身体特征（比如属性值/技能/状态/记忆/……），或者“延续“上级的身体特征。除此以外，可以进行其他与延续相关的行为，能否发动，视情况而定。" }
            ]
        },
        // 更多权柄...
    ],

    skills: {
        "力量": [
            { name: "攀爬", class: "基础", description: "力量；" },
            { name: "游泳", class: "基础", description: "力量；" },
            { name: "角斗", class: "基础", description: "力量；蛮力、挣脱、抢夺、近身格斗等能力；" },
            { name: "投掷", class: "基础", description: "力量；" },
            { name: "强韧", class: "基础", description: "力量；抵抗中毒、疲惫、物理伤害的能力；" },
            { name: "械斗（）", class: "基础", description: "力量；选择某种武器；" },
        ],
        "敏捷": [
            { name: "闪避", class: "基础", description: "敏捷；快速移动的能力；" },
            { name: "体操", class: "基础", description: "敏捷；精密的全身运动，包括潜行；" },
            { name: "瞄准", class: "基础", description: "敏捷；" },
            { name: "巧手", class: "基础", description: "敏捷；精密的手部操作；" },
            { name: "驾驶", class: "基础", description: "敏捷；" },
            { name: "表演（）", class: "基础", description: "敏捷；选择某项表演能力，如演奏乐器、歌唱、舞蹈、戏剧等；" },
        ],
        "智慧": [
            { name: "知识（）", class: "基础", description: "智慧；选择某个学科；" },
            { name: "解构", class: "基础", description: "智慧；破解机关、谜题，理解文字内容；" },
            { name: "信息搜集", class: "基础", description: "智慧；翻阅图书、提取要点、快速记忆；" },
            { name: "外语（）", class: "基础", description: "智慧；选择某种语言；" },
        ],
        "魅力": [
            { name: "说服", class: "基础", description: "魅力；" },
            { name: "威慑", class: "基础", description: "魅力；" },
            { name: "魅惑", class: "基础", description: "魅力；" },
            { name: "欺瞒", class: "基础", description: "魅力；" },
            { name: "驯兽", class: "基础", description: "魅力；" },
            { name: "精神抗性", class: "基础", description: "魅力；" },
        ],
        "感知": [
            { name: "侦察", class: "基础", description: "感知；察觉环境变化；" },
            { name: "洞悉", class: "基础", description: "感知；解读他人想法；" },
            { name: "医药", class: "基础", description: "感知；诊断疾病、稳定濒死队友、基础医疗知识；" },
            { name: "灵感", class: "基础", description: "感知；" },
        ],
        "法力": [
            { name: "火球术", class: "法师类通用", description: "法力；效果：火属性伤害；" },
            { name: "精神控制", class: "人鱼歌者", description: "法力/魅力；" },
            { name: "水球弹", class: "玉鳞卫士兵", description: "法力；来源：神山；效果：水属性伤害；隶属组合技：超级大水球；" }
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
            { name: "麟笏", type: "礼器", modifier: "", description: "哈维耶人用于祭祀的礼器"},
            { name: "福带", type: "礼器", modifier: "", description: "哈维耶人传统丝织品，用于祭祀的礼器"},
            { name: "福神杖", type: "礼器", modifier: "", description: "哈维耶人用于祭祀的礼器，大致造型为一根由蛇盘绕的木杖"}
        ]
    },

    inventory: {
        "装备": [
            { name: "普通大剑", weight: 20, description: "eee" }
        ],
        "食物": [
            { name: "米饭", weight: 0.5, description: "可以消除一点饥饿值" }
        ],
        "钱币": [
            { name: "汇率", weight: 0, description: "优玛币：0；怀武币：0；赫尔韦林币：0；博拉迪亚币：0；漠益币：0；巴兰门币：0；德买西亚币：0；汗国币：0；魏国币；天之原地之国币：0；"}
        ],
        "医疗物品": [
            { name: "止血绷带", weight: 0, description: ""},
        ],
        "药剂": [
            { name: "魔力回复剂", weight: 0.5, description: ""},
        ],
        "储备/其他物品": [
            { name: "墨水", weight: 0.5, description: ""},
            { name: "蜡烛", weight: 0, description: ""},
            { name: "柴火", weight: 0.5, description: ""},
            { name: "羽毛", weight: 0, description: ""},
            { name: "普通子弹", weight: 0, description: ""},
        ],
    },

    classes: {
        "巴兰门": [],
        "漠益": [],
        "博拉迪亚": [],
        "德买西亚": [],
        "赫尔韦林": [],
        "神山": [],
        "优玛": [],
        "大魏帝国": [],
        "怀武国": [
            {
                name: "采药人",
                type: "工农/浪人",
                bkgd: "他们是群山与幽谷的常客，深谙草木习性、天时地气。不仅是为采集药材，更是与自然达成一种古老的契约。他们相信万物有灵，最好的药材需要以“炁”感应，用心采集，方能保留其全部灵效。他们既是药铺的供应商，也是山民们的赤脚医生，有时还会成为冒险队伍中不可或缺的向导和医师。",
                skills: [
                    { name: "灵嗅慧眼", description: "在自然地形中进行感知检定以寻找特定植物、追踪野兽、察觉自然陷阱或预测天气变化时，可以获得优势。此外，他们能本能地分辨出具有药用或毒性的动植物。"},
                    { name: "敬天惜物", description: "他们拒绝进行无度的、破坏性的采集。若其行为对自然环境造成主动且不必要的严重破坏（如为捷径砍伐百年古木、为抓一兽焚烧整片山林），【灵嗅慧眼】提供的优势将失效，直至其通过行动（如植树、养护）进行弥补。"},
                    { name: "炁蕴采集", description: "感知/敏捷；消耗：1 健康；效果：并非用手，而是用“炁”来引导植物精华的流泻，进行最完美的采集。成功：采集到的药材品质+1（具体效果由GM裁定，例如：炼制出的药剂效果增强、持续时间变长、或可直接作为更高阶药剂的替代材料）。大成功：除品质+1外，本次采集数量翻倍（代表完美地引导了植物的灵蕴，未造成丝毫浪费）。"},
                    { name: "百草试解", description: "感知/智慧；消耗：无（但可能需要消耗少量材料）效果：利用随身携带的小型研钵和药杵，快速分析一种未知的植物、矿物或怪物体液样本。成功：GM需告知玩家该物质至少一种明确的属性（例如：“毒性，接触后会造成【痛苦】”、“强效止血”、“服用后令人产生幻觉”）。大成功：GM告知更详细的信息（如毒性强度、如何解毒、何种生物抗性等）。"},
                ]
            },
        ],
        "金厉汗国": [],
        "南部诸岛": [],
        "天之原地之国": [],
        "其他": [],
    }
};
