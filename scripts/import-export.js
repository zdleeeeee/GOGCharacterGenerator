// import-export.js - 数据导入导出
const { AlignmentType, BorderStyle, CompatibilityMode, Document, HeadingLevel, ImageRun, Paragraph, ShadingType, TableLayoutType, TextRun, Packer, TableCell, TableRow, Table, WidthType } = docx;
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
    a.download = `GOG角色档案_${character.name}.json`;
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

      if (character.portrait) {
        try {
          // 将Base64字符串转换为Uint8Array
          const base64Data = character.portrait.split(';base64,').pop();
          const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

          docChildren.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new ImageRun({
                  data: imageBuffer,
                  transformation: {
                    width: 200,  // 图片宽度
                    height: 250, // 图片高度
                  },
                }),
              ],
            })
          );
        } catch (error) {
          console.error("处理角色肖像失败:", error);
          // 即使图像处理失败，也继续导出其他内容
        }
      }

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
        this.createPropertyParagraph("角色名", character.name),
        this.createPropertyParagraph("玩家", character.player),
        this.createPropertyParagraph("性别", character.gender),
        this.createPropertyParagraph("年龄", character.age?.toString() || "未知"),
        this.createPropertyParagraph("阵营", character.alignment),
        this.createPropertyParagraph("国籍", character.nationality),
        this.createPropertyParagraph("职业", character.class),
        this.createPropertyParagraph("赐福", character.blessing),
        this.createPropertyParagraph("描述", character.description),
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

        // 权柄特技
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 },
          children: [new TextRun({
            text: "赐福特技",
            bold: true,
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
      saveAs(blob, `${character.name}_GOG角色档案.docx`);

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
            width: { size: 20, type: WidthType.PERCENTAGE }
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
            children: [new Paragraph({ text: '健康' })], width: { size: 20, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ text: `${attributes.HP.base} ` })],
            width: { size: 20, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ text: '' })], width: { size: 20, type: WidthType.PERCENTAGE }, shading: { fill: "f2f2f2" }
          }),
          new TableCell({
            children: [new Paragraph({ text: '' })], width: { size: 20, type: WidthType.PERCENTAGE }, shading: { fill: "f2f2f2" }
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
            children: [new Paragraph({ text: '魔力' })], width: { size: 20, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ text: `${attributes.MP.base}` })],
            width: { size: 20, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ text: '' })], width: { size: 20, type: WidthType.PERCENTAGE }, shading: { fill: "f2f2f2" }
          }),
          new TableCell({
            children: [new Paragraph({ text: '' })], width: { size: 20, type: WidthType.PERCENTAGE }, shading: { fill: "f2f2f2" }
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
      layout: TableLayoutType.FIXED,
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
      margins: { top: 100, bottom: 100, left: 100, right: 100 }
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
    if (!statusList || statusList.length === 0) {
      return new Paragraph({
        text: "当前无任何状态效果",
        italics: true,
        color: '666666'
      });
    }

    // 将状态列表转换为用【】包裹的文本
    const statusText = statusList
      .map(status => `【${status}】`)
      .join('  \t'); // 分隔状态

    return new Table({
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
                      text: "当前状态: ",
                      bold: true,
                      color: "666666"
                    }),
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
      margins: { top: 100, bottom: 100, left: 100, right: 100 }
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
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '特技名称', bold: true })] })], shading: { fill: "f2f2f2" } }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: '特技描述', bold: true })] })],
              colSpan: 2, shading: { fill: "f2f2f2" }
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
      margins: { top: 100, bottom: 100, left: 100, right: 100 }
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
            new TableCell({ children: [new Paragraph({ text: skill.name })], width: { size: 25, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ text: skill.proficiency.toString() })], width: { size: 10, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ text: skill.uses.toString() })], width: { size: 15, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ text: skill.description })], width: { size: 60, type: WidthType.PERCENTAGE } }),
          ],
        });
      });

      tables.push(
        new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "技能名", bold: true })] })], shading: { fill: "f2f2f2" } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "熟练度", bold: true })] })], shading: { fill: "f2f2f2" } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "使用次数", bold: true })] })], shading: { fill: "f2f2f2" } }),
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
          margins: { top: 100, bottom: 100, left: 100, right: 100 }
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
          new TableCell({ children: [new Paragraph({ text: item.type })] }),
          new TableCell({ children: [new Paragraph({ text: item.modifier })] }),
          new TableCell({ children: [new Paragraph({ text: item.description || "" })] }),
        ],
      });
    });

    return new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "名称", bold: true })] })], shading: { fill: "f2f2f2" }, width: { size: 20, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "类型", bold: true })] })], shading: { fill: "f2f2f2" }, width: { size: 20, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "属性影响", bold: true })] })], shading: { fill: "f2f2f2" }, width: { size: 25, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "描述", bold: true })] })], shading: { fill: "f2f2f2" }, width: { size: 35, type: WidthType.PERCENTAGE } }),
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
      margins: { top: 100, bottom: 100, left: 100, right: 100 }
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
            new TableCell({ children: [new Paragraph({ text: item.weight?.toString() || "0" })], width: { size: 15, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ text: item.description || "" })], width: { size: 50, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ text: item.quantity?.toString() || "0" })], width: { size: 10, type: WidthType.PERCENTAGE } }),
          ],
        });
      });

      tables.push(
        new Table({
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
          margins: { top: 100, bottom: 100, left: 100, right: 100 }
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
                  margins: { top: 100, bottom: 100, left: 100, right: 100 }
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
                  margins: { top: 100, bottom: 100, left: 100, right: 100 }
                })
              ]
            }),
          ]
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
};
