// import-export.js - 数据导入导出
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
}