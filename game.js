class Entity {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.direction = 0; // 0: 上, 1: 右, 2: 下, 3: 左
    }

    draw(ctx) {
        // 基础绘制方法被子类覆盖
        this.drawBase(ctx);
    }

    // 绘制发光效果
    drawGlow(ctx, color, size) {
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = size;
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }

    // 绘制六边形
    drawHexagon(ctx, x, y, size, color, strokeColor) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const xPos = x + size * Math.cos(angle);
            const yPos = y + size * Math.sin(angle);
            if (i === 0) {
                ctx.moveTo(xPos, yPos);
            } else {
                ctx.lineTo(xPos, yPos);
            }
        }
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    // 添加绘制血量的方法
    drawHealthBar(ctx) {
        // 只有具有生命值的实体才显示血条
        if (typeof this.health === 'undefined' || typeof this.maxHealth === 'undefined') {
            return;
        }

        const padding = 2;
        const barHeight = 4;
        const barWidth = this.width;
        
        // 血条背景
        ctx.fillStyle = '#333';
        ctx.fillRect(
            this.x,
            this.y - barHeight - padding,
            barWidth,
            barHeight
        );
        
        // 当前血量
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = this.getHealthColor(healthPercent);
        ctx.fillRect(
            this.x,
            this.y - barHeight - padding,
            barWidth * healthPercent,
            barHeight
        );
        
        // 显示血量数值
        if (this.health > 0) {  // 只在血量大于0时显示数值
            ctx.font = '12px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            const text = `${this.health}/${this.maxHealth}`;
            const textX = this.x + this.width / 2;
            const textY = this.y - barHeight - padding - 2;
            
            ctx.strokeText(text, textX, textY);
            ctx.fillText(text, textX, textY);
        }
    }

    getHealthColor(percent) {
        if (percent > 0.6) return '#2ecc71'; // 绿色
        if (percent > 0.3) return '#f1c40f'; // 黄色
        return '#e74c3c';                    // 红色
    }
}

// 玩家类
class Player extends Entity {
    constructor(x, y) {
        super(x, y, 40, 40, 'green');
        this.health = 5;
        this.maxHealth = 5;
        this.attack = 1;
        this.bulletCount = 1;
        this.exp = 0;
        this.level = 1;
        this.lastShot = 0;
        this.shootCooldown = 500; // 0.5秒冷却时间
    }

    move(dx, dy, obstacles, mapWidth, mapHeight) {
        const newX = this.x + dx;
        const newY = this.y + dy;
        
        // 检查地图边界
        if (newX < 0 || newX + this.width > mapWidth || 
            newY < 0 || newY + this.height > mapHeight) {
            return false;
        }
        
        // 检查障碍物碰撞
        for (const obstacle of obstacles) {
            if (this.checkCollision({x: newX, y: newY}, obstacle)) {
                return false;
            }
        }
        
        this.x = newX;
        this.y = newY;
        return true;
    }

    checkCollision(pos, other) {
        return pos.x < other.x + other.width &&
               pos.x + this.width > other.x &&
               pos.y < other.y + other.height &&
               pos.y + this.height > other.y;
    }

    shoot() {
        const now = Date.now();
        if (now - this.lastShot < this.shootCooldown) {
            return [];
        }
        
        this.lastShot = now;
        const bullets = [];
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        for (let i = 0; i < this.bulletCount; i++) {
            bullets.push(new Bullet(
                centerX,
                centerY,
                this.direction,
                this.attack,
                true
            ));
        }
        
        return bullets;
    }

    gainExp(amount) {
        this.exp += amount;
        if (this.exp >= 3) {
            this.levelUp();
            this.exp -= 3;
        }
    }

    levelUp() {
        this.level++;
        // 随机选择一种强化
        const upgrade = Math.floor(Math.random() * 3);
        switch(upgrade) {
            case 0: // 血量强化
                this.health = this.maxHealth;
                this.maxHealth += 1;
                this.health = this.maxHealth;
                break;
            case 1: // 攻击力强化
                this.attack += 1;
                break;
            case 2: // 子弹数量强化
                this.bulletCount += 1;
                break;
        }
    }

    draw(ctx) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // 减少发光效果
        this.drawGlow(ctx, '#0f6', 8);
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((this.direction * Math.PI) / 2);
        
        // 绘制外部轮廓
        this.drawHexagon(ctx, 0, 0, this.width / 2, '#0a4', '#0fc');
        
        // 绘制内部六边形
        this.drawHexagon(ctx, 0, 0, this.width / 3, '#0c6', '#0fc');
        
        // 绘制中心圆
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 6, 0, Math.PI * 2);
        ctx.fillStyle = '#0fc';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 绘制炮管
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -this.height / 1.5);
        ctx.strokeStyle = '#0fc';
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();

        // 绘制血条和血量数值
        this.drawHealthBar(ctx);
    }
}

class Bullet extends Entity {
    constructor(x, y, direction, damage, isPlayerBullet) {
        super(x, y, 4, 4, isPlayerBullet ? 'black' : 'red');
        this.direction = direction;
        this.damage = damage;
        this.speed = 80; // 每0.5秒移动一个单位
        this.isPlayerBullet = isPlayerBullet;
    }

    update(deltaTime) {
        const distance = this.speed * deltaTime;
        switch(this.direction) {
            case 0: this.y -= distance; break; // 上
            case 1: this.x += distance; break; // 右
            case 2: this.y += distance; break; // 下
            case 3: this.x -= distance; break; // 左
        }
    }

    isOutOfBounds(mapWidth, mapHeight) {
        return this.x < 0 || this.x > mapWidth ||
               this.y < 0 || this.y > mapHeight;
    }

    draw(ctx) {
        const color = this.isPlayerBullet ? '#0f6' : '#f44';
        const highlightColor = this.isPlayerBullet ? '#fff' : '#fff';
        
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 5;
        
        // 绘制子弹主体
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 
                this.width / 2, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = highlightColor;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 绘制能量尾迹
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y + this.height / 2);
        let tailX = this.x + this.width / 2;
        let tailY = this.y + this.height / 2;
        switch(this.direction) {
            case 0: tailY += this.height; break;
            case 1: tailX -= this.width; break;
            case 2: tailY -= this.height; break;
            case 3: tailX += this.width; break;
        }
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    }
}

class Enemy extends Entity {
    constructor(x, y, type) {
        const types = {
            'fixed': { color: 'blue', health: 1, attack: 1, speed: 0, exp: 1 },
            'medium': { color: 'yellow', health: 2, attack: 1, speed: 2, exp: 2 },
            'heavy': { color: 'red', health: 5, attack: 1, speed: 1, exp: 3 }
        };
        
        const config = types[type];
        super(x, y, 40, 40, config.color);
        
        this.type = type;
        this.health = config.health;
        this.maxHealth = config.health; // 添加最大血量属性
        this.attack = config.attack;
        this.speed = config.speed;
        this.exp = config.exp;
        this.lastShot = 0;
        this.shootCooldown = 1000; // 1秒冷却时间
    }

    update(deltaTime, player, obstacles, mapWidth, mapHeight) {
        if (this.type !== 'fixed') {
            // 简单的AI：朝玩家方向移动
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            
            // 确定移动方向
            if (Math.abs(dx) > Math.abs(dy)) {
                this.direction = dx > 0 ? 1 : 3;
                const moveX = this.speed * deltaTime * (dx > 0 ? 1 : -1);
                this.move(moveX, 0, obstacles, mapWidth, mapHeight);
            } else {
                this.direction = dy > 0 ? 2 : 0;
                const moveY = this.speed * deltaTime * (dy > 0 ? 1 : -1);
                this.move(0, moveY, obstacles, mapWidth, mapHeight);
            }
        }
        
        // 尝试射击
        return this.tryShoot(player);
    }

    move(dx, dy, obstacles, mapWidth, mapHeight) {
        const newX = this.x + dx;
        const newY = this.y + dy;
        
        if (newX < 0 || newX + this.width > mapWidth || 
            newY < 0 || newY + this.height > mapHeight) {
            return false;
        }
        
        for (const obstacle of obstacles) {
            if (this.checkCollision({x: newX, y: newY}, obstacle)) {
                return false;
            }
        }
        
        this.x = newX;
        this.y = newY;
        return true;
    }

    checkCollision(pos, other) {
        return pos.x < other.x + other.width &&
               pos.x + this.width > other.x &&
               pos.y < other.y + other.height &&
               pos.y + this.height > other.y;
    }

    tryShoot(player) {
        const now = Date.now();
        if (now - this.lastShot < this.shootCooldown) {
            return null;
        }
        
        // 检查是否在同一直线上，并且没有障碍物阻挡
        const inLine = (
            Math.abs(this.x - player.x) < this.width ||
            Math.abs(this.y - player.y) < this.height
        );
        
        if (inLine) {
            // 确定射击方向
            if (Math.abs(this.x - player.x) < this.width) {
                this.direction = player.y < this.y ? 0 : 2;
            } else {
                this.direction = player.x < this.x ? 3 : 1;
            }
            
            this.lastShot = now;
            return new Bullet(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.direction,
                this.attack,
                false
            );
        }
        
        return null;
    }

    takeDamage(amount) {
        this.health -= amount;
        return this.health <= 0;
    }

    draw(ctx) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        let colors;
        switch(this.type) {
            case 'fixed':
                colors = {
                    glow: '#08f',
                    base: '#04a',
                    accent: '#0cf',
                    highlight: '#fff'
                };
                break;
            case 'medium':
                colors = {
                    glow: '#ff0',
                    base: '#da0',
                    accent: '#ff6',
                    highlight: '#fff'
                };
                break;
            case 'heavy':
                colors = {
                    glow: '#f00',
                    base: '#a00',
                    accent: '#f44',
                    highlight: '#fff'
                };
                break;
        }
        
        this.drawGlow(ctx, colors.glow, 8);
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((this.direction * Math.PI) / 2);
        
        // 绘制外部六���形
        this.drawHexagon(ctx, 0, 0, this.width / 2, colors.base, colors.accent);
        
        // 绘制内部装饰
        if (this.type === 'fixed') {
            // 固定炮台样式
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 3, 0, Math.PI * 2);
            ctx.strokeStyle = colors.accent;
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.strokeStyle = colors.highlight;
            ctx.lineWidth = 1;
            ctx.stroke();
        } else {
            // 移动单位样式
            ctx.beginPath();
            for (let i = 0; i < 4; i++) {
                const angle = (i * Math.PI) / 2;
                ctx.moveTo(0, 0);
                const x = (this.width / 3) * Math.cos(angle);
                const y = (this.width / 3) * Math.sin(angle);
                ctx.lineTo(x, y);
            }
            ctx.strokeStyle = colors.accent;
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.strokeStyle = colors.highlight;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        // 绘制炮管
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -this.height / 1.5);
        ctx.strokeStyle = colors.accent;
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.strokeStyle = colors.highlight;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();

        // 绘制血条和血量数值
        this.drawHealthBar(ctx);
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentLevel = 0;
        this.unlockedLevels = 1;
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.obstacles = [];
        this.gridSize = 40; // 每个格子的像素大小
        this.lastMoveTime = 0; // 记录上次移动时间
        this.moveDelay = 150; // 移动间隔（毫秒）
        this.isLevelCompleted = false;
        this.isGameCompleted = false;

        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.joystickActive = false;
        this.joystickPos = { x: 0, y: 0 };
        
        if (this.isMobile) {
            this.initMobileControls();
        }
        
        this.initEventListeners();

        // 修改状态栏为竖排布局
        this.statusBarWidth = 150;  // 状态栏宽度
        this.canvas.width += this.statusBarWidth; // 增加画布宽度来容纳状态栏
    }

    initEventListeners() {
        // 关卡选择按钮事件
        document.querySelectorAll('.level-btn').forEach((btn, index) => {
            btn.addEventListener('click', () => this.startLevel(index + 1));
        });

        // 返回按钮事件
        document.getElementById('back-btn').addEventListener('click', () => {
            this.showLevelSelect();
        });

        // 添加键盘控制
        this.keys = {};
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === 'Enter') {
                this.playerShoot();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    initMobileControls() {
        const joystick = document.getElementById('joystick-base');
        const thumb = document.getElementById('joystick-thumb');
        const shootBtn = document.getElementById('shoot-btn');
        
        // 射击按钮事件
        shootBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.playerShoot();
        });

        // 摇杆控制
        joystick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.joystickActive = true;
            this.updateJoystickPosition(e.touches[0], joystick, thumb);
        });

        document.addEventListener('touchmove', (e) => {
            if (this.joystickActive) {
                e.preventDefault();
                this.updateJoystickPosition(e.touches[0], joystick, thumb);
            }
        }, { passive: false });

        document.addEventListener('touchend', () => {
            if (this.joystickActive) {
                this.joystickActive = false;
                this.joystickPos = { x: 0, y: 0 };
                thumb.style.transform = 'translate(-50%, -50%)';
            }
        });
    }

    updateJoystickPosition(touch, joystick, thumb) {
        const rect = joystick.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        let x = touch.clientX - centerX;
        let y = touch.clientY - centerY;
        
        // 限制摇杆移动范围
        const maxDistance = rect.width / 2 - thumb.offsetWidth / 2;
        const distance = Math.sqrt(x * x + y * y);
        
        if (distance > maxDistance) {
            const angle = Math.atan2(y, x);
            x = Math.cos(angle) * maxDistance;
            y = Math.sin(angle) * maxDistance;
        }
        
        // 更新摇杆位置
        thumb.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
        
        // 更新移动方向
        this.joystickPos = {
            x: x / maxDistance,
            y: y / maxDistance
        };
        
        // 更新玩家朝向
        if (Math.abs(x) > Math.abs(y)) {
            this.player.direction = x > 0 ? 1 : 3;
        } else {
            this.player.direction = y > 0 ? 2 : 0;
        }
    }

    showLevelSelect() {
        document.getElementById('level-select').classList.remove('hidden');
        document.getElementById('game-screen').classList.add('hidden');
    }

    startLevel(level) {
        this.isLevelCompleted = false;
        this.isGameCompleted = false;
        this.currentLevel = level;
        
        // 调整游戏区域的大小
        const mapSizes = {
            1: { size: 6 },
            2: { size: 9 },
            3: { size: 15 }
        };
        
        const gridSize = this.gridSize;
        const mapSize = mapSizes[level].size * gridSize;
        
        // 设置画布大小，包含状态栏宽度
        this.canvas.width = mapSize + this.statusBarWidth;
        this.canvas.height = mapSize;
        
        document.getElementById('level-select').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        
        this.initGame(level);
    }

    initGame(level) {
        // 初始化游戏状态
        this.player = new Player(
            Math.floor(this.canvas.width / (2 * this.gridSize)) * this.gridSize,
            Math.floor(this.canvas.height / (2 * this.gridSize)) * this.gridSize
        );
        
        // 生成地图和敌人
        this.generateMap(level);
        
        // 开始游戏循环
        this.gameLoop();
    }

    gameLoop() {
        const now = Date.now();
        const deltaTime = (now - (this.lastUpdate || now)) / 1000;
        this.lastUpdate = now;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        if (this.isMobile && this.joystickActive) {
            // 移动端控制逻辑
            if (Date.now() - this.lastMoveTime >= this.moveDelay) {
                const dx = Math.round(this.joystickPos.x) * this.gridSize;
                const dy = Math.round(this.joystickPos.y) * this.gridSize;
                
                if (dx !== 0 || dy !== 0) {
                    const moved = this.player.move(dx, dy, this.obstacles, 
                        this.canvas.width, this.canvas.height);
                    if (moved) {
                        this.lastMoveTime = Date.now();
                    }
                }
            }
        } else {
            // PC端键盘控制逻辑保持不变
            // 处理玩家移动（每次移动一个格子）
            const now = Date.now();
            if (now - this.lastMoveTime >= this.moveDelay) {
                let moved = false;
                
                if (this.keys['w']) {
                    this.player.direction = 0;
                    moved = this.player.move(0, -this.gridSize, this.obstacles, this.canvas.width, this.canvas.height);
                } else if (this.keys['s']) {
                    this.player.direction = 2;
                    moved = this.player.move(0, this.gridSize, this.obstacles, this.canvas.width, this.canvas.height);
                } else if (this.keys['a']) {
                    this.player.direction = 3;
                    moved = this.player.move(-this.gridSize, 0, this.obstacles, this.canvas.width, this.canvas.height);
                } else if (this.keys['d']) {
                    this.player.direction = 1;
                    moved = this.player.move(this.gridSize, 0, this.obstacles, this.canvas.width, this.canvas.height);
                }
                
                if (moved) {
                    this.lastMoveTime = now;
                }
            }
        }

        // 更新敌人
        this.enemies.forEach(enemy => {
            const bullet = enemy.update(deltaTime, this.player, this.obstacles, 
                this.canvas.width, this.canvas.height);
            if (bullet) {
                this.bullets.push(bullet);
            }
        });

        // 更新子弹
        this.bullets.forEach(bullet => {
            bullet.update(deltaTime);
            
            // 检查子弹碰撞
            if (bullet.isPlayerBullet) {
                // 检查子弹是否击中障碍物
                this.obstacles.forEach((obstacle, index) => {
                    if (obstacle.health > 0 && this.checkCollision(bullet, obstacle)) {
                        if (obstacle.takeDamage(bullet.damage)) {
                            // 如果障碍物被摧毁，更新网格
                            const gridX = Math.floor(obstacle.x / this.gridSize);
                            const gridY = Math.floor(obstacle.y / this.gridSize);
                            this.grid[gridY][gridX] = 0;
                        }
                        bullet.toRemove = true;
                    }
                });

                // 检查子弹是否击中敌人
                this.enemies.forEach((enemy, index) => {
                    if (this.checkCollision(bullet, enemy)) {
                        if (enemy.takeDamage(bullet.damage)) {
                            this.player.gainExp(enemy.exp);
                            this.enemies.splice(index, 1);
                        }
                        bullet.toRemove = true;
                    }
                });
            } else {
                // 检查子弹是否击中玩家
                if (this.checkCollision(bullet, this.player)) {
                    this.player.health -= bullet.damage;
                    bullet.toRemove = true;
                    
                    if (this.player.health <= 0) {
                        this.gameOver();
                    }
                }
            }
            
            // 检查子弹是否击中障碍物
            this.obstacles.forEach(obstacle => {
                if (this.checkCollision(bullet, obstacle)) {
                    bullet.toRemove = true;
                }
            });
        });
        
        // 移除标记的子弹
        this.bullets = this.bullets.filter(bullet => 
            !bullet.toRemove && !bullet.isOutOfBounds(this.canvas.width, this.canvas.height));
            
        // 移除已摧毁的障碍物
        this.obstacles = this.obstacles.filter(obstacle => obstacle.health > 0);
        
        // 检查是否通关
        if (this.enemies.length === 0 && !this.isLevelCompleted) {
            this.isLevelCompleted = true;
            this.levelComplete();
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制状态栏
        this.drawStatusBar();
        
        // 将所有游戏元素的绘制位置右移状态栏的宽度
        this.ctx.save();
        this.ctx.translate(this.statusBarWidth, 0);
        
        // 绘制游戏元素
        this.obstacles.forEach(obstacle => obstacle.draw(this.ctx));
        this.player.draw(this.ctx);
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        this.bullets.forEach(bullet => bullet.draw(this.ctx));
        
        this.ctx.restore();
    }

    playerShoot() {
        if (this.player) {
            const newBullets = this.player.shoot();
            this.bullets.push(...newBullets);
        }
    }

    generateMap(level) {
        this.obstacles = [];
        this.enemies = [];
        
        const mapSizes = {
            1: { size: 6, enemies: 3, obstacles: 10, types: ['fixed'] },
            2: { size: 9, enemies: 10, obstacles: 30, types: ['fixed', 'medium'] },
            3: { size: 15, enemies: 25, obstacles: 70, types: ['fixed', 'medium', 'heavy'] }
        };
        
        const config = mapSizes[level];
        
        // 创建网格表示
        this.grid = Array(config.size).fill().map(() => Array(config.size).fill(0));
        
        // 生成障碍物
        while (this.obstacles.length < config.obstacles) {
            const gridX = Math.floor(Math.random() * config.size);
            const gridY = Math.floor(Math.random() * config.size);
            const x = gridX * this.gridSize;
            const y = gridY * this.gridSize;
            
            // 确保不会生成在玩家位置
            const playerGridX = Math.floor(this.player.x / this.gridSize);
            const playerGridY = Math.floor(this.player.y / this.gridSize);
            
            if (Math.abs(gridX - playerGridX) < 2 && 
                Math.abs(gridY - playerGridY) < 2) {
                continue;
            }
            
            // 临时放置障碍物
            this.grid[gridY][gridX] = 1;
            
            const obstacle = new Entity(x, y, this.gridSize - 4, this.gridSize - 4, '#666');
            // 添加生命值属性，但不显示血条
            obstacle.health = 3;
            obstacle.maxHealth = 3;
            
            obstacle.takeDamage = function(amount) {
                this.health -= amount;
                return this.health <= 0;
            };
            
            obstacle.draw = function(ctx) {
                if (this.health <= 0) return;

                const centerX = this.x + this.width / 2;
                const centerY = this.y + this.height / 2;
                
                ctx.save();
                ctx.shadowColor = '#88f';
                ctx.shadowBlur = 5;
                
                // 绘制主体
                ctx.beginPath();
                ctx.moveTo(this.x + 5, this.y);
                ctx.lineTo(this.x + this.width - 5, this.y);
                ctx.lineTo(this.x + this.width, this.y + 5);
                ctx.lineTo(this.x + this.width, this.y + this.height - 5);
                ctx.lineTo(this.x + this.width - 5, this.y + this.height);
                ctx.lineTo(this.x + 5, this.y + this.height);
                ctx.lineTo(this.x, this.y + this.height - 5);
                ctx.lineTo(this.x, this.y + 5);
                ctx.closePath();
                
                // 根据生命值改变颜色和发光效果
                const healthPercent = this.health / this.maxHealth;
                const gradient = ctx.createLinearGradient(this.x, this.y, 
                    this.x + this.width, this.y + this.height);
                    
                if (healthPercent > 0.66) {
                    gradient.addColorStop(0, '#223');
                    gradient.addColorStop(0.5, '#334');
                    gradient.addColorStop(1, '#223');
                    ctx.shadowColor = '#88f';
                } else if (healthPercent > 0.33) {
                    gradient.addColorStop(0, '#322');
                    gradient.addColorStop(0.5, '#433');
                    gradient.addColorStop(1, '#322');
                    ctx.shadowColor = '#f88';
                } else {
                    gradient.addColorStop(0, '#422');
                    gradient.addColorStop(0.5, '#533');
                    gradient.addColorStop(1, '#422');
                    ctx.shadowColor = '#f44';
                }
                
                ctx.fillStyle = gradient;
                ctx.fill();
                
                // 根据生命值改变边框颜色
                ctx.strokeStyle = healthPercent > 0.66 ? '#99f' : 
                                healthPercent > 0.33 ? '#f99' : '#f66';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // 添加裂纹效果（当生命值低时）
                if (healthPercent <= 0.66) {
                    ctx.beginPath();
                    ctx.moveTo(this.x + this.width * 0.3, this.y);
                    ctx.lineTo(this.x + this.width * 0.7, this.y + this.height);
                    if (healthPercent <= 0.33) {
                        ctx.moveTo(this.x, this.y + this.height * 0.3);
                        ctx.lineTo(this.x + this.width, this.y + this.height * 0.7);
                    }
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
                
                ctx.restore();
            };
            
            // 检查是否与其他障碍物重叠且不会阻塞路径
            if (!this.obstacles.some(obs => this.checkCollision(obstacle, obs)) &&
                this.checkConnectivity(playerGridX, playerGridY, config.size)) {
                this.obstacles.push(obstacle);
            } else {
                // 如果阻塞了路径，移除这个障碍物
                this.grid[gridY][gridX] = 0;
            }
        }
        
        // 生成敌人
        while (this.enemies.length < config.enemies) {
            const gridX = Math.floor(Math.random() * config.size);
            const gridY = Math.floor(Math.random() * config.size);
            const x = gridX * this.gridSize;
            const y = gridY * this.gridSize;
            
            // 确保不会生成在玩家位置附近
            const playerGridX = Math.floor(this.player.x / this.gridSize);
            const playerGridY = Math.floor(this.player.y / this.gridSize);
            
            if (Math.abs(gridX - playerGridX) < 3 && 
                Math.abs(gridY - playerGridY) < 3) {
                continue;
            }
            
            // 检查该位置是否有障碍物
            if (this.grid[gridY][gridX] === 1) {
                continue;
            }
            
            // 检查是否有路径可以到达玩家
            const tempGrid = this.grid.map(row => [...row]);
            if (!this.hasPathToPlayer(gridX, gridY, playerGridX, playerGridY, tempGrid)) {
                continue;
            }
            
            // 随机选择敌人类型
            const type = config.types[Math.floor(Math.random() * config.types.length)];
            const enemy = new Enemy(x, y, type);
            
            // 检查是否与其他敌人重叠
            if (!this.enemies.some(e => this.checkCollision(enemy, e))) {
                this.enemies.push(enemy);
            }
        }
    }

    // 检查从起点到终点是否有可行路径（广度优先搜索）
    hasPathToPlayer(startX, startY, endX, endY, grid) {
        const queue = [{x: startX, y: startY, path: []}];
        const visited = new Set();
        const directions = [
            {dx: 0, dy: -1}, // 上
            {dx: 1, dy: 0},  // 右
            {dx: 0, dy: 1},  // 下
            {dx: -1, dy: 0}  // 左
        ];

        while (queue.length > 0) {
            const current = queue.shift();
            const key = `${current.x},${current.y}`;

            if (current.x === endX && current.y === endY) {
                return true;
            }

            if (visited.has(key)) continue;
            visited.add(key);

            for (const dir of directions) {
                const nextX = current.x + dir.dx;
                const nextY = current.y + dir.dy;

                if (nextX >= 0 && nextX < grid[0].length &&
                    nextY >= 0 && nextY < grid.length &&
                    grid[nextY][nextX] === 0 &&
                    !visited.has(`${nextX},${nextY}`)) {
                    queue.push({
                        x: nextX,
                        y: nextY,
                        path: [...current.path, {x: nextX, y: nextY}]
                    });
                }
            }
        }

        return false;
    }

    // 检查地图连通性
    checkConnectivity(startX, startY, size) {
        const visited = Array(size).fill().map(() => Array(size).fill(false));
        const queue = [{x: startX, y: startY}];
        visited[startY][startX] = true;
        
        const directions = [
            {x: 0, y: -1},
            {x: 1, y: 0},
            {x: 0, y: 1},
            {x: -1, y: 0}
        ];
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            for (const dir of directions) {
                const newX = current.x + dir.x;
                const newY = current.y + dir.y;
                
                if (newX >= 0 && newX < size && 
                    newY >= 0 && newY < size && 
                    !visited[newY][newX] && 
                    this.grid[newY][newX] === 0) {
                    visited[newY][newX] = true;
                    queue.push({x: newX, y: newY});
                }
            }
        }
        
        // 检查所有非障碍物格子是否都被访问到
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                if (this.grid[y][x] === 0 && !visited[y][x]) {
                    return false;
                }
            }
        }
        
        return true;
    }

    checkCollision(entity1, entity2) {
        return entity1.x < entity2.x + entity2.width &&
               entity1.x + entity1.width > entity2.x &&
               entity1.y < entity2.y + entity2.height &&
               entity1.y + entity1.height > entity2.y;
    }

    gameOver() {
        if (this.isGameCompleted) {
            return
        }
        this.isGameCompleted = true;
        alert('游戏结束！');
        this.showLevelSelect();
    }

    levelComplete() {
        if (this.currentLevel < 3) {
            this.unlockedLevels = Math.max(this.unlockedLevels, this.currentLevel + 1);
            document.querySelectorAll('.level-btn').forEach((btn, index) => {
                btn.disabled = index >= this.unlockedLevels;
            });
        }
        alert('恭喜通关！');
        this.showLevelSelect();
    }

    drawStatusBar() {
        // 绘制状态栏背景
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.statusBarWidth, this.canvas.height);
        
        // 设置文本样式
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        
        // 计算各个属性的位置
        const padding = 10;
        const spacing = 40;  // 每个属性之间的垂直间距
        const x = padding;
        let y = padding + spacing;
        
        // 绘制生命值
        this.ctx.fillStyle = this.player.getHealthColor(this.player.health / this.player.maxHealth);
        this.ctx.fillText(`生命: ${this.player.health}/${this.player.maxHealth}`, x, y);
        
        // 绘制等级
        y += spacing;
        this.ctx.fillStyle = '#f1c40f'; // 黄色
        this.ctx.fillText(`等级: ${this.player.level}`, x, y);
        
        // 绘制经验值
        y += spacing;
        this.ctx.fillStyle = '#2ecc71'; // 绿色
        this.ctx.fillText(`经验: ${this.player.exp}/3`, x, y);
        
        // 绘制攻击力
        y += spacing;
        this.ctx.fillStyle = '#e74c3c'; // 红色
        this.ctx.fillText(`攻击: ${this.player.attack}`, x, y);
        
        // 绘制子弹数
        y += spacing;
        this.ctx.fillStyle = '#3498db'; // 蓝色
        this.ctx.fillText(`子弹数: ${this.player.bulletCount}`, x, y);
        
        // 绘制当前关卡
        y += spacing;
        this.ctx.fillStyle = '#9b59b6'; // 紫色
        this.ctx.fillText(`关卡: ${this.currentLevel}`, x, y);
        
        // 绘制分隔线
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.statusBarWidth, 0);
        this.ctx.lineTo(this.statusBarWidth, this.canvas.height);
        this.ctx.stroke();
    }

    // 这里继续添加其他游戏逻辑...
}

// 初始化游戏
const game = new Game(); 