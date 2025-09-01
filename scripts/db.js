// db.js - IndexedDB 初始化与管理
class CharacterDB {
    constructor() {
        this.dbName = 'GOGCharacterDB';
        this.dbVersion = 2;
        this.db = null;
    }

    // 打开或创建数据库
    openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const oldVersion = event.oldVersion || 0;
                if (!db.objectStoreNames.contains('characters')) {
                    db.createObjectStore('characters', { keyPath: 'id', autoIncrement: true });
                }
                if (oldVersion < 2) {
                    if (!db.objectStoreNames.contains('staticData')) {
                        db.createObjectStore('staticData');
                    }
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = (event) => {
                reject('Database error: ' + event.target.error);
            };
        });
    }

    // 添加/更新角色
    async saveCharacter(character) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['characters'], 'readwrite');
            const store = transaction.objectStore('characters');

            // 确保有有效的id
            if (character.id === null || character.id === undefined) {
                // 新角色 - 让autoIncrement生成id
                delete character.id;
            }

            const request = store.put(character);

            request.onsuccess = () => {
                // 返回完整的角色数据（包括 id）
                const updatedCharacter = { ...character, id: request.result };
                resolve(updatedCharacter);
            };
            request.onerror = (event) => {
                console.error('保存错误:', event.target.error);
                reject(new Error(`保存失败: ${event.target.error.message}`));
            };
        });
    }

    // 获取所有角色
    async getAllCharacters() {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['characters'], 'readonly');
            const store = transaction.objectStore('characters');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    // 删除角色
    async deleteCharacter(id) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['characters'], 'readwrite');
            const store = transaction.objectStore('characters');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    }

    // 保存静态数据（图鉴数据）
    async saveStaticData(data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['staticData'], 'readwrite');
            const store = transaction.objectStore('staticData');

            const request = store.put(data, 'staticData');

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // 获取静态数据（图鉴数据）
    async getStaticData() {
        if (!this.db.objectStoreNames.contains('staticData')) {
            return null; // 存储不存在，返回 null
        }
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['staticData'], 'readonly');
            const store = transaction.objectStore('staticData');

            const request = store.get('staticData');

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }


    // 完全删除数据库
    async deleteEntireDB() {
        return new Promise((resolve, reject) => {
            // 1. 先主动关闭现有连接
            if (this.db) {
                this.db.close();
            }

            // 2. 延迟一下确保连接关闭
            setTimeout(() => {
                const request = indexedDB.deleteDatabase(this.dbName);

                request.onsuccess = () => {
                    console.log("数据库删除成功");
                    resolve();
                };

                request.onerror = (event) => {
                    console.error("数据库删除失败:", event.target.error);
                    reject(new Error(`删除数据库失败: ${event.target.error.message}`));
                };

                request.onblocked = () => {
                    console.warn("数据库删除被阻止(可能有未关闭的连接)");
                    reject(new Error("数据库正被使用，请刷新后重试"));
                };
            }, 100);    // 100ms延迟确保连接释放
        });
    }
}