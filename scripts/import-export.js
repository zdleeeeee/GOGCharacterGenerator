// import-export.js - 数据导入导出
const { AlignmentType, BorderStyle, CompatibilityMode, Document, HeadingLevel, HeightRule,
  ImageRun, Paragraph, ShadingType, TableLayoutType, TextRun, Packer, TableCell,
  TableRow, Table, VerticalAlign, WidthType } = docx;
const { saveAs } = window;
class DataHandler {
  constructor(db) {
    this.db = db;
  }

  // 导出角色数据为JSON文件
  async exportCharacter(id) {
    const characters = await this.db.getAllCharacters();
    const character = characters.find(c => c.id === id);
    if (!character) throw new Error('角色不存在');

    const dataStr = JSON.stringify(character, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `GOG角色_${character.name}.json`;
    a.click();

    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  // 导出为Word
  async exportToWord(id) {
    const characters = await this.db.getAllCharacters();
    const character = characters.find(c => c.id === id);
    if (!character) throw new Error('角色不存在');

    try {
      // 1. 创建Word文档结构
      const docChildren = [];

      docChildren.push(
        // 标题
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: `GOG角色档案_${character.name}`,
              bold: true,
              size: 28,
              color: "333333"
            }),
          ],
        }),
      );

      docChildren.push(
        // 基本信息
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "基本信息",
              bold: true,
              size: 26,
              color: "333333"
            }),
          ],
        }),

        // 基本信息表格
        this.createBasicInfoTable(character),

        new Paragraph({
          spacing: { after: 200 }  // 调整这个值控制间距大小
        }),

        // 属性
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "属性系统",
              bold: true,
              size: 26,
              color: "333333"
            }),
          ],
        }),
        this.createPropertyParagraph("身份", character.isGod || "人类"),
        this.createAttributeTable(character.attributes),
        new Paragraph({
          spacing: { after: 200 }  // 调整这个值控制间距大小
        }),

        // 状态
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "状态系统",
              bold: true,
              size: 26,
              color: "333333"
            }),
          ],
        }),
        this.createStatusTable(character.status),
        new Paragraph({
          spacing: { after: 200 }  // 调整这个值控制间距大小
        }),

        // 赐福系统
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 },
          children: [new TextRun({
            text: `赐福系统`,
            bold: true,
            size: 26,
            color: "333333"
          })]
        }),

        this.createSoulParagraph(character.soul),
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({
            text: `${character.blessingFullName || '赐福系统'} (等级 ${character.blessinglevel})`,
            bold: true,
            size: 22,
            color: "666666"
          })]
        }),
        this.createBlessingSystemTable(character.blessingSystem),

        // 赐福特技
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 0 },
          children: [new TextRun({
            text: "",
            size: 22,
            color: "666666",
            alignment: AlignmentType.CENTER
          })]
        }),
        this.createBlessingSkillsTable(character.blessingSkills),
        new Paragraph({
          spacing: { after: 200 }  // 调整这个值控制间距大小
        }),

        // 技能
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "技能系统",
              bold: true,
              size: 26,
              color: "333333"
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: `技能熟练度总点数：`,
              bold: true,
              size: 20,
              color: "666666"
            }),
            new TextRun({
              text: `${document.getElementById('skill-prof-left').textContent.toString()}`,
              bold: true,
              size: 20,
              color: '28a745'
            }),
          ],
        }),
        ...this.createSkillsTable(character.skills),
        new Paragraph({
          spacing: { after: 200 }  // 调整这个值控制间距大小
        }),

        // 装备
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "装备系统",
              bold: true,
              size: 26,
              color: "333333"
            }),
          ],
        }),
        this.createEquipsTable(character.equipment),
        new Paragraph({
          spacing: { after: 200 }  // 调整这个值控制间距大小
        }),

        // 物品
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "背包系统",
              bold: true,
              size: 26,
              color: "333333"
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: `总负重：`,
              bold: true,
              size: 20,
              color: "666666"
            }),
            new TextRun({
              text: `${document.getElementById('total-weight').textContent.toString()} kg`,
              bold: true,
              size: 20,
              color: "28a745"
            }),
          ],
        }),
        ...this.createItemsTable(character.inventory),
        new Paragraph({
          spacing: { after: 200 }  // 调整这个值控制间距大小
        }),

        // 日志
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "日志系统",
              bold: true,
              size: 24,
              color: "333333"
            }),
          ],
        }),
        ...this.createLogsSection(character.logs),
      );
      const doc = new Document({
        creator: "GOG角色系统",  // 必须设置
        title: `GOG角色档案_${character.name}`,
        description: "角色数据导出",
        sections: [{
          properties: {
            page: {
              width: 11906,  // A4宽度(21cm)
              height: 16838, // A4高度(29.7cm)
              margins: {
                top: 1440,   // 2.54cm
                bottom: 1440,
                left: 1800,  // 3.17cm
                right: 1800
              }
            }
          },
          children: docChildren, // 使用构建好的子元素数组
        }],
        // 添加中文字体支持
        styles: {
          default: {
            document: {
              run: {
                font: "Microsoft YaHei", // 微软雅黑
              },
            },
          },
        },
      });

      // 2. 生成Word文件
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `GOG角色_${character.name}.docx`);

    } catch (error) {
      console.error("导出Word失败:", error);
      throw new Error("导出Word文件时出错");
    }
  }

  // 辅助方法：创建属性段落
  createPropertyParagraph(label, value) {
    const valueText = value || "无";
    const valueParts = valueText.split('\n'); // 分割换行符

    const children = [
      new TextRun({
        text: `${label}: `,
        bold: true,
        color: "666666"
      })
    ];

    // 为每个部分添加TextRun，并在需要时添加换行
    valueParts.forEach((part, index) => {
      if (index > 0) {
        children.push(new TextRun({
          text: "",
          break: 1 // 添加换行
        }));
      }
      children.push(new TextRun({
        text: part,
        color: "333333"
      }));
    });

    return new Paragraph({
      children: children,
      spacing: {
        after: 100,
      },
    });
  }

  // 辅助方法：创建基本信息表格
  createBasicInfoTable(character) {
    const portraitCell = character.portrait ?
      new TableCell({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: Uint8Array.from(
                  atob(character.portrait.split(';base64,').pop()),
                  c => c.charCodeAt(0)
                ),
                transformation: {
                  width: 120,
                  height: 150,
                },
              }),
            ],
          })
        ],
        rowSpan: 5,
        verticalAlign: "center",
        width: { size: 20, type: WidthType.PERCENTAGE }
      }) :
      new TableCell({
        children: [new Paragraph({ text: "无头像" })],
        rowSpan: 5,
        verticalAlign: "center",
        width: { size: 20, type: WidthType.PERCENTAGE },
        shading: { fill: "f2f2f2" }
      });

    return new Table({
      layout: TableLayoutType.AUTOFIT,
      columnWidths: [1776, 3552, 3552],
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
        left: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
        right: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" },
        insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" }
      },
      rows: [
        // 第一行：姓名
        new TableRow({
          children: [
            portraitCell,
            new TableCell({
              children: [new Paragraph({
                children: [
                  new TextRun({ text: "姓名", bold: true, color: "666666" }),
                  new TextRun({ text: ": " }),
                  new TextRun({ text: character.name || "未知", color: "333333" })
                ]
              })],
              width: { size: 80, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              columnSpan: 2,
              margins: { top: 40, bottom: 40, left: 100, right: 100 }
            })
          ],
        }),

        // 第二行：玩家
        new TableRow({
          children: [
            // 第一格被肖像占用，跳过
            new TableCell({
              children: [new Paragraph({
                children: [
                  new TextRun({ text: "玩家", bold: true, color: "666666" }),
                  new TextRun({ text: ": " }),
                  new TextRun({ text: character.player || "未知", color: "333333" })
                ]
              })],
              width: { size: 80, type: WidthType.PERCENTAGE },
              columnSpan: 2,
              margins: { top: 40, bottom: 40, left: 100, right: 100 }
            })
          ],
        }),

        // 第三行：性别和年龄
        new TableRow({
          children: [
            // 第一格被肖像占用，跳过
            new TableCell({
              children: [new Paragraph({
                children: [
                  new TextRun({ text: "性别", bold: true, color: "666666" }),
                  new TextRun({ text: ": " }),
                  new TextRun({ text: character.gender || "未知", color: "333333" })
                ]
              })],
              width: { size: 40, type: WidthType.PERCENTAGE },
              margins: { top: 40, bottom: 40, left: 100, right: 100 }
            }),
            new TableCell({
              children: [new Paragraph({
                children: [
                  new TextRun({ text: "年龄", bold: true, color: "666666" }),
                  new TextRun({ text: ": " }),
                  new TextRun({ text: character.age?.toString() || "未知", color: "333333" })
                ]
              })],
              width: { size: 40, type: WidthType.PERCENTAGE },
              margins: { top: 40, bottom: 40, left: 100, right: 100 }
            })
          ],
        }),

        // 第四行：阵营和国籍
        new TableRow({
          children: [
            // 第一格被肖像占用，跳过
            new TableCell({
              children: [new Paragraph({
                children: [
                  new TextRun({ text: "阵营", bold: true, color: "666666" }),
                  new TextRun({ text: ": " }),
                  new TextRun({ text: character.alignment || "未知", color: "333333" })
                ]
              })],
              width: { size: 40, type: WidthType.PERCENTAGE },
              margins: { top: 40, bottom: 40, left: 100, right: 100 }
            }),
            new TableCell({
              children: [new Paragraph({
                children: [
                  new TextRun({ text: "国籍", bold: true, color: "666666" }),
                  new TextRun({ text: ": " }),
                  new TextRun({ text: character.nationality || "未知", color: "333333" })
                ]
              })],
              width: { size: 40, type: WidthType.PERCENTAGE },
              margins: { top: 40, bottom: 40, left: 100, right: 100 }
            })
          ],
        }),

        // 第五行：职业和赐福
        new TableRow({
          children: [
            // 第一格被肖像占用，跳过
            new TableCell({
              children: [new Paragraph({
                children: [
                  new TextRun({ text: "职业", bold: true, color: "666666" }),
                  new TextRun({ text: ": " }),
                  new TextRun({ text: character.class || "未知", color: "333333" })
                ]
              })],
              width: { size: 40, type: WidthType.PERCENTAGE },
              margins: { top: 40, bottom: 40, left: 100, right: 100 }
            }),
            new TableCell({
              children: [new Paragraph({
                children: [
                  new TextRun({ text: "赐福", bold: true, color: "666666" }),
                  new TextRun({ text: ": " }),
                  new TextRun({ text: character.blessing || "未知", color: "333333" })
                ]
              })],
              width: { size: 40, type: WidthType.PERCENTAGE },
              margins: { top: 40, bottom: 40, left: 100, right: 100 }
            })
          ],
        }),

        // 第六行：描述（横跨整行）
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({
                children: [
                  new TextRun({ text: "描述", bold: true, color: "666666" }),
                  new TextRun({ text: ": " }),
                  new TextRun({ text: character.description || "无", color: "333333" })
                ]
              })],
              columnSpan: 3,
              margins: { top: 20, bottom: 20, left: 100, right: 100 }
            })
          ]
        })
      ]
    });
  }

  // 辅助方法：创建属性表格
  createAttributeTable(attributes) {
    // 前六个主要属性
    const mainAttributes = ['STR', 'DEX', 'INT', 'CHA', 'WIS', 'MAG'];

    const rows = mainAttributes.map(key => {
      const attr = attributes[key];
      const total = document.getElementById(`attr-${key}-total`).textContent;

      return new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: this.getAttributeName(key) })],
            width: { size: 20, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            children: [new Paragraph({ text: attr.base.toString() })],
            width: { size: 20, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ text: attr.statusAdj.toString() })],
            width: { size: 20, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ text: attr.blessingAdj.toString() })],
            width: { size: 20, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: total.toString(), bold: true })] })],
            width: { size: 20, type: WidthType.PERCENTAGE }
          }),
        ],
      });
    });

    // 添加HP和MP
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: '健康' })], width: { size: 20, type: WidthType.PERCENTAGE }, verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            children: [new Paragraph({ text: `${attributes.HP.base} ` })],
            width: { size: 20, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ text: '' })], width: { size: 20, type: WidthType.PERCENTAGE }, shading: { fill: "f2f2f2" }, columnSpan: 2
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({
                text: `${attributes.HP.current}/${document.getElementById('attr-HP-max').textContent.toString()}`,
                bold: true
              })]
            })],
            width: { size: 20, type: WidthType.PERCENTAGE }
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: '魔力' })], width: { size: 20, type: WidthType.PERCENTAGE }, verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            children: [new Paragraph({ text: `${attributes.MP.base}` })],
            width: { size: 20, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ text: '' })], width: { size: 20, type: WidthType.PERCENTAGE }, shading: { fill: "f2f2f2" }, columnSpan: 2
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({
                text: `${attributes.MP.current}/${document.getElementById('attr-MP-max').textContent.toString()}`,
                bold: true
              })]
            })],
            width: { size: 20, type: WidthType.PERCENTAGE }
          }),
        ],
      })
    );

    return new Table({
      layout: TableLayoutType.AUTOFIT,
      columnWidths: [1776, 1776, 1776, 1776, 1776], // 我最终不得已这样写代码了，经测试这样可以保持在office上自动将表格宽度填满页面，同时在qq上按固定宽度显示，真的无语了，sjb
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '属性', bold: true })] })], shading: { fill: "f2f2f2" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '基础值', bold: true })] })], shading: { fill: "f2f2f2" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '状态调整', bold: true })] })], shading: { fill: "f2f2f2" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '赐福调整', bold: true })] })], shading: { fill: "f2f2f2" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '总值', bold: true })] })], shading: { fill: "f2f2f2" } }),
          ],
        }),
        ...rows,
      ],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
        left: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
        right: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" },
        insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" }
      },
      width: { size: 100, type: WidthType.PERCENTAGE },
      margins: { top: 20, bottom: 20, left: 100, right: 100 }
    });
  }

  // 辅助方法：获取属性中文名
  getAttributeName(key) {
    const names = {
      PRF: '职业',
      STR: '力量',
      DEX: '敏捷',
      INT: '智慧',
      CHA: '魅力',
      WIS: '感知',
      MAG: '法力'
    };
    return names[key] || key;
  }
  getCategoryName(categoryKey) {
    return Character.categoryMappings[categoryKey] || categoryKey; // 默认返回原key
  }

  // 辅助方法：创建状态文本
  createStatusTable(statusList) {

    // 将状态列表转换为用【】包裹的文本
    const statusText = statusList
      .map(status => `【${status}】`)
      .join('  \t'); // 分隔状态

    return new Table({
      layout: TableLayoutType.AUTOFIT,
      columnWidths: [8880],
      width: {
        size: 100,
        type: WidthType.PERCENTAGE
      },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
        left: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
        right: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" },
        insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" }
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: statusText,
                      bold: true,
                      color: "3498db"
                    })
                  ],
                  spacing: { after: 0 }
                })
              ],
              shading: {
                fill: "f2f2f2" // 灰色背景
              },
              margins: { top: 100, bottom: 100, left: 100, right: 100 }
            })
          ]
        }),
      ]
    })
  }

  // 创建赐福系统表格
  createBlessingSystemTable(blessingSystem) {
    const rows = blessingSystem.map((level, index) => {
      return new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: level.level })], width: { size: 15, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ text: level.attribute })], width: { size: 20, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ text: level.skill })], width: { size: 30, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ text: level.corruption })], width: { size: 35, type: WidthType.PERCENTAGE } }),
        ],
      });
    });

    return new Table({
      layout: TableLayoutType.AUTOFIT,
      columnWidths: [1332, 1776, 2664, 3108],
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '赐福等级', bold: true, color: "333333" })] })], shading: { fill: "f2f2f2" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '关联属性', bold: true, color: "333333" })] })], shading: { fill: "f2f2f2" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '赐福特技', bold: true, color: "333333" })] })], shading: { fill: "f2f2f2" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '异化程度', bold: true, color: "333333" })] })], shading: { fill: "f2f2f2" } }),
          ],
        }),
        ...rows,
      ],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
        left: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
        right: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" },
        insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" }
      },
      width: { size: 100, type: WidthType.PERCENTAGE },
      margins: { top: 20, bottom: 20, left: 100, right: 100 }
    });
  }

  // 获取精神状态
  createSoulParagraph(soul) {
    let tcolor = '666666';
    if (soul > 90) {
      tcolor = '6d35dd'
    } else if (soul > 80) {
      tcolor = 'ca2cab';
    } else if (soul > 60) {
      tcolor = '4169e1';
    } else if (soul > 40) {
      tcolor = '3ad2e0';
    } else if (soul > 20) {
      tcolor = '3cb371';
    } else if (soul >= 1) {
      tcolor = 'e69c5b';
    } else if (soul === 0) {
      tcolor = '666666';
    }

    return new Paragraph({
      children: [
        new TextRun({
          text: "赐福经验值（BXP）：",
          bold: true,
          color: "666666"
        }),
        new TextRun({
          text: `${soul?.toString() || 0}\t`,
          bold: true,
          color: "28a745"
        }),
        new TextRun({
          text: `  【${document.getElementById('soul-status').textContent}】` || "  【世俗之人】",
          bold: true,
          color: tcolor,
        }),
      ],
      spacing: {
        after: 100,
      },
    });
  }

  // 创建赐福特技表格
  createBlessingSkillsTable(blessingSkills) {
    const rows = blessingSkills.map((skill, index) => {
      return new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: skill.name || '' })], width: { size: 15, type: WidthType.PERCENTAGE } }),
          new TableCell({
            children: [new Paragraph({ text: skill.description || '' })],
            width: { size: 85, type: WidthType.PERCENTAGE }
          }),
        ],
      });
    });

    return new Table({
      layout: TableLayoutType.AUTOFIT,
      columnWidths: [1332, 7548],
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '特技名称', bold: true })] })], shading: { fill: "f2f2f2" } }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: '特技描述', bold: true })] })],
              shading: { fill: "f2f2f2" }
            }),
          ],
        }),
        ...rows,
      ],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
        left: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
        right: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" },
        insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" }
      },
      width: { size: 100, type: WidthType.PERCENTAGE },
      margins: { top: 20, bottom: 20, left: 100, right: 100 }
    });
  }

  // 辅助方法：创建技能表格
  createSkillsTable(skills) {
    const tables = [];
    if (!skills || skills.length === 0) {
      tables.push(new Paragraph({
        text: "无技能",
        italics: true,
        color: '666666'
      })
      );
      return tables;
    }

    for (const [attr, skillList] of Object.entries(skills)) {
      if (skillList.length === 0) continue;

      // 添加属性分类标题
      tables.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          alignment: AlignmentType.CENTER,
          children: [new TextRun({
            text: `${this.getAttributeName(attr)}类技能`,
            color: "666666"
          })]
        })
      );

      // 创建当前属性的技能表格
      const rows = skillList.map(skill => {
        return new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: skill.name })], width: { size: 20, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ text: skill.proficiency.toString() })], width: { size: 10, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ text: skill.uses.toString() })], width: { size: 10, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ text: skill.description })], width: { size: 60, type: WidthType.PERCENTAGE } }),
          ],
        });
      });

      tables.push(
        new Table({
          layout: TableLayoutType.AUTOFIT,
          columnWidths: [1776, 888, 888, 5328],
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "技能名", bold: true })] })], shading: { fill: "f2f2f2" } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "熟练度", bold: true })] })], shading: { fill: "f2f2f2" } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "使用", bold: true })] })], shading: { fill: "f2f2f2" } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "描述", bold: true })] })], shading: { fill: "f2f2f2" } }),
              ],
            }),
            ...rows,
          ],
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
            left: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
            right: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" },
            insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" }
          },
          width: { size: 100, type: WidthType.PERCENTAGE },
          margins: { top: 20, bottom: 20, left: 100, right: 100 }
        })
      );
    }

    return tables;
  }

  // 辅助方法：创建装备表格
  createEquipsTable(items) {
    if (!items || items.length === 0) {
      return new Paragraph({
        text: "无装备",
        italics: true,
        color: '666666'
      });
    }
    const rows = items.map(item => {
      return new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: item.name })] }),
          new TableCell({ children: [new Paragraph({ text: item.description || "" })] }),
        ],
      });
    });

    return new Table({
      layout: TableLayoutType.AUTOFIT,
      columnWidths: [2220, 6660],
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "名称", bold: true })] })], shading: { fill: "f2f2f2" }, width: { size: 25, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "描述", bold: true })] })], shading: { fill: "f2f2f2" }, width: { size: 75, type: WidthType.PERCENTAGE } }),
          ],
        }),
        ...rows,
      ],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
        left: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
        right: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" },
        insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" }
      },
      width: { size: 100, type: WidthType.PERCENTAGE },
      margins: { top: 20, bottom: 20, left: 100, right: 100 }
    });
  }

  // 辅助方法：创建物品表格
  createItemsTable(items) {
    const tables = [];
    if (!items || items.length === 0) {
      tables.push(new Paragraph({
        text: "无物品",
        italics: true,
        color: '666666'
      })
      );
      return tables;
    }

    for (const [category, itemList] of Object.entries(items)) {
      if (itemList.length === 0) continue;

      tables.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          alignment: AlignmentType.CENTER,
          children: [new TextRun({
            text: `${this.getCategoryName(category)}`,
            color: "666666"
          })]
        })
      );

      const rows = itemList.map(item => {
        return new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: item.name || "" })], width: { size: 25, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ text: item.weight?.toString() || "0" })], width: { size: 10, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ text: item.description || "" })], width: { size: 55, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ text: item.quantity?.toString() || "0" })], width: { size: 10, type: WidthType.PERCENTAGE } }),
          ],
        });
      });

      tables.push(
        new Table({
          layout: TableLayoutType.AUTOFIT,
          columnWidths: [2220, 888, 4884, 888],
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "名称", bold: true })] })], shading: { fill: "f2f2f2" } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "重量", bold: true })] })], shading: { fill: "f2f2f2" } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "描述", bold: true })] })], shading: { fill: "f2f2f2" } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "数量", bold: true })] })], shading: { fill: "f2f2f2" } }),
              ],
            }),
            ...rows,
          ],
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
            left: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
            right: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" },
            insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" }
          },
          width: { size: 100, type: WidthType.PERCENTAGE },
          margins: { top: 20, bottom: 20, left: 100, right: 100 }
        })
      );
    }

    return tables;
  }

  // 辅助方法：创建日志部分
  createLogsSection(logs) {
    // 创建一个包含所有日志表格的段落数组
    const logElements = [];

    if (!logs || logs.length === 0) {
      logElements.push(new Paragraph({
        text: "无日志",
        italics: true,
        color: '666666'
      })
      );
      return logElements;
    }

    logs.forEach(log => {
      // 每个日志之间添加一些间距
      const logText = log.content || "无内容";
      const valueParts = logText.split('\n'); // 分割换行符

      // 为每个部分添加TextRun，并在需要时添加换行
      const children = [];
      valueParts.forEach((part, index) => {
        if (index > 0) {
          children.push(new TextRun({
            text: "",
            break: 1 // 添加换行
          }));
        }
        children.push(new TextRun({
          text: part,
          color: "333333"
        }));
      });

      logElements.push(

        new Table({
          layout: TableLayoutType.AUTOFIT,
          columnWidths: [8800],
          width: {
            size: 100,
            type: WidthType.PERCENTAGE
          },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
            left: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
            right: { style: BorderStyle.SINGLE, size: 4, color: "dddddd" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" },
            insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" }
          },
          rows: [
            // 标题行（灰色背景）
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: log.title || "未命名日志",
                          bold: true,
                        })
                      ],
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 0 }
                    })
                  ],
                  shading: {
                    fill: "f2f2f2" // 灰色背景
                  },
                  margins: { top: 40, bottom: 40, left: 100, right: 100 }
                })
              ]
            }),
            // 内容行
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: children,
                      spacing: { after: 0 }
                    })
                  ],
                  margins: { top: 20, bottom: 20, left: 100, right: 100 }
                })
              ]
            }),
          ],
          margins: { top: 20, bottom: 500, left: 0, right: 0 }
        }),
        new Paragraph({
          spacing: { after: 0 }  // 调整这个值控制间距大小
        })
      );
    });

    return logElements;
  }

  // 批量导出所有角色
  async exportAllCharacters() {
    const characters = await this.db.getAllCharacters();
    const dataStr = JSON.stringify(characters, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `GOG角色_全部导出.json`;
    a.click();

    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  // 从JSON文件导入角色
  async importCharacter(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const content = event.target.result;
          if (!content) {
            throw new Error('文件内容为空');
          }

          // 解析JSON数据
          let data;
          try {
            data = JSON.parse(content);
          } catch (e) {
            throw new Error('无效的JSON格式');
          }

          // 处理单角色或多角色导入
          let importedCount = 0;
          if (Array.isArray(data)) {
            // 批量导入多个角色
            if (data.length === 0) {
              throw new Error('导入文件不包含任何角色数据');
            }

            // 依次导入每个角色
            for (const characterData of data) {
              try {
                await this.importSingleCharacter(characterData);
                importedCount++;
              } catch (err) {
                console.warn(`角色导入失败: ${err.message}`);
                // 继续导入其他角色
              }
            }
          } else {
            // 单个角色导入
            await this.importSingleCharacter(data);
            importedCount = 1;
          }

          resolve(importedCount);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  }

  /**
   * 导入单个角色数据
   * @param {Object} characterData 角色数据对象
   */
  async importSingleCharacter(characterData) {
    // 验证数据格式
    if (!characterData.name || !characterData.attributes) {
      throw new Error('无效的角色数据格式 - 缺少必要字段');
    }

    // 创建新角色对象
    const character = new Character(characterData);
    character.id = null; // 确保创建新记录

    // 保存到数据库
    await this.db.saveCharacter(character);
  }

  // 处理图鉴数据文件上传
  async handleDataFileUpload(file) {
    if (!file) return;

    try {
      const fileContent = await this.readFileContent(file);
      const data = this.parseDataFile(fileContent, file.name);

      // 保存到 IndexedDB
      await this.db.saveStaticData(data);

      // 重新初始化应用
      this.staticData = data;
      window.staticData = data;

      // 重新渲染界面
      const overlay = document.getElementById('data-upload-overlay');
      if (overlay) {
        document.body.removeChild(overlay);
      }

      const toast = document.getElementById('toast');
      toast.textContent = '数据文件加载成功！';
      toast.classList.add('toast-visible');

      setTimeout(() => {
        toast.classList.remove('toast-visible');
      }, 2000);

    } catch (error) {
      alert(`数据文件加载失败: ${error.message}`);
      console.error('数据文件加载错误:', error);
    }
  }

  // 读取文件内容
  readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  }

  // 解析数据文件
  parseDataFile(content, filename) {
    try {
      if (filename.endsWith('.json')) {
        // JSON 格式
        return JSON.parse(content);
      } else if (filename.endsWith('.js')) {
        // JS 文件格式（提取 window.staticData 赋值）
        const jsContent = content;

        // 创建一个临时环境来执行 JS 代码
        const sandbox = {
          window: {},
          console: console
        };

        // 使用 Function 构造函数而不是 eval
        const execute = new Function('window', `
                    ${jsContent};
                    return window.staticData;
                `);

        const result = execute(sandbox.window);

        if (!result) {
          throw new Error('JS 文件中未找到 staticData 对象');
        }

        return result;
      } else {
        throw new Error('不支持的文件格式，请上传 .js 或 .json 文件');
      }
    } catch (error) {
      throw new Error(`数据文件解析失败: ${error.message}`);
    }
  }
};
