// import-export.js - 数据导入导出
const { BorderStyle, Document, HeadingLevel, Paragraph, TextRun, Packer, TableCell, TableRow, Table, WidthType } = docx;
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
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // 标题
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              children: [
                new TextRun({
                  text: `GOG角色档案_${character.name}`,
                  bold: true,
                  size: 28,
                }),
              ],
            }),

            // 基本信息
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              children: [
                new TextRun({
                  text: "基本信息",
                  bold: true,
                  size: 24,
                }),
              ],
            }),
            this.createPropertyParagraph("角色名", character.name),
            this.createPropertyParagraph("玩家", character.playerName),
            this.createPropertyParagraph("性别", character.gender),
            this.createPropertyParagraph("年龄", character.age?.toString() || "未知"),
            this.createPropertyParagraph("阵营", character.alignment),
            this.createPropertyParagraph("国籍", character.nationality),
            this.createPropertyParagraph("职业", character.class),
            this.createPropertyParagraph("赐福", character.blessing),

            // 描述
            new Paragraph({
              heading: HeadingLevel.HEADING_3,
              children: [
                new TextRun({
                  text: "角色描述",
                  bold: true
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: character.description || "暂无描述",
                }),
              ],
            }),

            // 属性
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              children: [
                new TextRun({
                  text: "属性值",
                  bold: true
                }),
              ],
            }),
            this.createAttributeTable(character.attributes),

            // 赐福系统
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              children: [new TextRun({
                text: `赐福系统`,
                bold: true
              })]
            }),

            this.createPropertyParagraph("灵魂完整度", character.soul?.toString() || 0),
            this.createPropertyParagraph("精神状态", this.getSoulStatus(character.soul)),
            new Paragraph({
              heading: HeadingLevel.HEADING_3,
              children: [new TextRun({
                text: `${character.blessing || '赐福'}系统 (等级 ${character.blessinglevel})`,
                bold: true
              })]
            }),
            this.createBlessingSystemTable(character.blessingSystem, character.blessingSkills),

            // 权柄特技
            new Paragraph({
              heading: HeadingLevel.HEADING_3,
              children: [new TextRun({ text: "权柄特技", bold: true })]
            }),
            this.createBlessingSkillsTable(character.blessingSkills),

            // 技能
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              children: [
                new TextRun({
                  text: "技能列表",
                  bold: true,
                  size: 24,
                }),
              ],
            }),
            ...this.createSkillsTable(character.skills),

            // 装备
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              children: [
                new TextRun({
                  text: "装备列表",
                  bold: true,
                  size: 24,
                }),
              ],
            }),
            this.createEquipsTable(character.equipment),

            // 物品
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              children: [
                new TextRun({
                  text: "背包系统",
                  bold: true,
                  size: 24,
                }),
              ],
            }),
            this.createItemsTable(character.inventory),

            // 日志
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              children: [
                new TextRun({
                  text: "日志系统",
                  bold: true,
                  size: 24,
                }),
              ],
            }),
            ...this.createLogsSection(character.logs),
          ],
        }],
      });

      // 2. 生成Word文件
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${character.name}_角色档案.docx`);

    } catch (error) {
      console.error("导出Word失败:", error);
      throw new Error("导出Word文件时出错");
    }
  }

  // 辅助方法：创建属性段落
  createPropertyParagraph(label, value) {
    return new Paragraph({
      children: [
        new TextRun({
          text: `${label}: `,
          bold: true,
        }),
        new TextRun({
          text: value || "无",
        }),
      ],
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
      const total = Math.max(0, Math.min(20, attr.base + attr.statusAdj + attr.blessingAdj));

      return new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: this.getAttributeName(key) })],
            width: { size: 20, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ text: attr.base.toString() })],
            width: { size: 15, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ text: attr.statusAdj.toString() })],
            width: { size: 15, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ text: attr.blessingAdj.toString() })],
            width: { size: 15, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ text: total.toString(), bold: true })],
            width: { size: 15, type: WidthType.PERCENTAGE }
          }),
        ],
      });
    });

    // 添加HP和MP
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: '健康' })],
            colSpan: 4
          }),
          new TableCell({
            children: [new Paragraph({ text: `${attributes.HP.base}` })],
            width: { size: 20, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({
              text: `${attributes.HP.current}/${attributes.HP.base + Math.max(0, Math.min(20, attributes.STR.base + attributes.STR.statusAdj + attributes.STR.blessingAdj)) * 2}`,
              bold: true
            })]
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: '魔力' })],
            colSpan: 4
          }),
          new TableCell({
            children: [new Paragraph({ text: `${attributes.MP.base}` })],
            width: { size: 20, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({
              text: `${attributes.MP.current}/${attributes.MP.base + attributes.MAG.base + attributes.MAG.statusAdj + attributes.MAG.blessingAdj}`,
              bold: true
            })]
          }),
        ],
      })
    );

    return new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: '属性', bold: true })], shading: { fill: "f2f2f2" } }),
            new TableCell({ children: [new Paragraph({ text: '基础值', bold: true })], shading: { fill: "f2f2f2" } }),
            new TableCell({ children: [new Paragraph({ text: '状态调整', bold: true })], shading: { fill: "f2f2f2" } }),
            new TableCell({ children: [new Paragraph({ text: '赐福调整', bold: true })], shading: { fill: "f2f2f2" } }),
            new TableCell({ children: [new Paragraph({ text: '总值', bold: true })], shading: { fill: "f2f2f2" } }),
          ],
        }),
        ...rows,
      ],
      width: { size: 100, type: WidthType.PERCENTAGE },
      margins: { top: 100, bottom: 100, left: 100, right: 100 }
    });
  }

  // 辅助方法：获取属性中文名
  getAttributeName(key) {
    const names = {
      STR: '力量',
      DEX: '敏捷',
      INT: '智慧',
      CHA: '魅力',
      WIS: '感知',
      MAG: '法力'
    };
    return names[key] || key;
  }

  // 创建赐福系统表格
  createBlessingSystemTable(blessingSystem, blessingSkills) {
    const rows = blessingSystem.map((level, index) => {
      const skill = blessingSkills[index] || {};

      return new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: level.level.toString() })] }),
          new TableCell({ children: [new Paragraph({ text: level.attribute })] }),
          new TableCell({ children: [new Paragraph({ text: level.bonus.toString() })] }),
          new TableCell({ children: [new Paragraph({ text: skill.name || '' })] }),
          new TableCell({ children: [new Paragraph({ text: level.soulWear.toString() })] }),
          new TableCell({ children: [new Paragraph({ text: level.corruption })] }),
        ],
      });
    });

    return new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: '赐福等级', bold: true })], shading: { fill: "f2f2f2" } }),
            new TableCell({ children: [new Paragraph({ text: '关联属性', bold: true })], shading: { fill: "f2f2f2" } }),
            new TableCell({ children: [new Paragraph({ text: '属性加点', bold: true })], shading: { fill: "f2f2f2" } }),
            new TableCell({ children: [new Paragraph({ text: '权柄特技', bold: true })], shading: { fill: "f2f2f2" } }),
            new TableCell({ children: [new Paragraph({ text: '灵魂磨损', bold: true })], shading: { fill: "f2f2f2" } }),
            new TableCell({ children: [new Paragraph({ text: '异化程度', bold: true })], shading: { fill: "f2f2f2" } }),
          ],
        }),
        ...rows,
      ],
      width: { size: 100, type: WidthType.PERCENTAGE },
      margins: { top: 100, bottom: 100, left: 100, right: 100 }
    });
  }

  // 获取精神状态
  getSoulStatus(soul) {
    const soulValue = soul || 0;

    // 根据灵魂完整度范围设置不同状态
    if (soulValue >= 80) {
      return "清醒";
    } else if (soulValue >= 60) {
      return "尚可";
    } else if (soulValue >= 40) {
      return "略显疯癫";
    } else if (soulValue >= 20) {
      return "疯子";
    } else if (soulValue >= 1) {
      return "理智的反义词";
    } else if (soulValue === 0) {
      return "永恒沉眠";
    }
  }

  // 创建权柄特技表格
  createBlessingSkillsTable(blessingSkills) {
    const rows = blessingSkills.map((skill, index) => {
      return new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: skill.name || '' })] }),
          new TableCell({
            children: [new Paragraph({ text: skill.description || '' })],
            colSpan: 2
          }),
        ],
      });
    });

    return new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: '特技名称', bold: true })], shading: { fill: "f2f2f2" } }),
            new TableCell({
              children: [new Paragraph({ text: '特技描述', bold: true })],
              colSpan: 2, shading: { fill: "f2f2f2" }
            }),
          ],
        }),
        ...rows,
      ],
      width: { size: 100, type: WidthType.PERCENTAGE },
      margins: { top: 100, bottom: 100, left: 100, right: 100 }
    });
  }

  // 辅助方法：创建技能表格
  createSkillsTable(skills) {
    const tables = [];

    for (const [attr, skillList] of Object.entries(skills)) {
      if (skillList.length === 0) continue;

      // 添加属性分类标题
      tables.push(
        new Paragraph({
          text: `${this.getAttributeName(attr)}类技能`,
          heading: HeadingLevel.HEADING_3,
          bold: true,
        })
      );

      // 创建当前属性的技能表格
      const rows = skillList.map(skill => {
        return new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: skill.name })] }),
            new TableCell({ children: [new Paragraph({ text: skill.proficiency.toString() })] }),
            new TableCell({ children: [new Paragraph({ text: skill.uses.toString() })] }),
            new TableCell({ children: [new Paragraph({ text: skill.description })] }),
          ],
        });
      });

      tables.push(
        new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: "技能名", bold: true })], shading: { fill: "f2f2f2" } }),
                new TableCell({ children: [new Paragraph({ text: "熟练度", bold: true })], shading: { fill: "f2f2f2" } }),
                new TableCell({ children: [new Paragraph({ text: "使用次数", bold: true })], shading: { fill: "f2f2f2" } }),
                new TableCell({ children: [new Paragraph({ text: "描述", bold: true })], shading: { fill: "f2f2f2" } }),
              ],
            }),
            ...rows,
          ],
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
        italics: true
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
            new TableCell({ children: [new Paragraph({ text: "名称", bold: true })], shading: { fill: "f2f2f2" } }),
            new TableCell({ children: [new Paragraph({ text: "类型", bold: true })], shading: { fill: "f2f2f2" } }),
            new TableCell({ children: [new Paragraph({ text: "属性影响", bold: true })], shading: { fill: "f2f2f2" } }),
            new TableCell({ children: [new Paragraph({ text: "描述", bold: true })], shading: { fill: "f2f2f2" } }),
          ],
        }),
        ...rows,
      ],
      width: { size: 100, type: WidthType.PERCENTAGE },
      margins: { top: 100, bottom: 100, left: 100, right: 100 }
    });
  }

  // 辅助方法：创建物品表格
  createItemsTable(items) {
    if (!items || items.length === 0) {
      return new Paragraph({
        text: "无物品",
        italics: true
      });
    }
    const rows = items.map(item => {
      return new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: item.name })] }),
          new TableCell({ children: [new Paragraph({ text: item.weight })] }),
          new TableCell({ children: [new Paragraph({ text: item.description })] }),
          new TableCell({ children: [new Paragraph({ text: item.quantity?.toString() || "-" })] }),
        ],
      });
    });

    return new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "物品", bold: true })], shading: { fill: "f2f2f2" } }),
            new TableCell({ children: [new Paragraph({ text: "重量", bold: true })], shading: { fill: "f2f2f2" } }),
            new TableCell({ children: [new Paragraph({ text: "描述", bold: true })], shading: { fill: "f2f2f2" } }),
            new TableCell({ children: [new Paragraph({ text: "数量", bold: true })], shading: { fill: "f2f2f2" } }),
          ],
        }),
        ...rows,
      ],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: "AAAAAA" },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "AAAAAA" },
        left: { style: BorderStyle.SINGLE, size: 4, color: "AAAAAA" },
        right: { style: BorderStyle.SINGLE, size: 4, color: "AAAAAA" }
      },
      width: { size: 100, type: WidthType.PERCENTAGE },
      margins: { top: 100, bottom: 100, left: 100, right: 100 }
    });
  }

  // 辅助方法：创建日志部分
  createLogsSection(logs) {
    if (!logs || logs.length === 0) {
      return new Paragraph({
        text: "无日志",
        italics: true
      });
    }

    // 创建一个包含所有日志表格的段落数组
    const logElements = [];

    logs.forEach(log => {
      // 每个日志之间添加一些间距
      logElements.push(
        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE
          },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: "AAAAAA" },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: "AAAAAA" },
            left: { style: BorderStyle.SINGLE, size: 4, color: "AAAAAA" },
            right: { style: BorderStyle.SINGLE, size: 4, color: "AAAAAA" }
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
                          bold: true
                        })
                      ],
                      spacing: { after: 0 }
                    })
                  ],
                  shading: {
                    fill: "f2f2f2" // 灰色背景
                  }
                })
              ]
            }),
            // 内容行
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      text: log.content || "无内容",
                      spacing: { before: 100, after: 100 }
                    })
                  ],
                  margins: {
                    top: 100,
                    bottom: 100,
                    left: 100,
                    right: 100
                  }
                })
              ]
            })
          ],
          margins: {
            top: 200,  // 增加上边距，使日志之间有间隔
            bottom: 200
          }
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
