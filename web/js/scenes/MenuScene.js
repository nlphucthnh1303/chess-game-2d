// ============================================================
// MenuScene.js — Main menu with animated background
// ============================================================

export class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2, cy = height / 2;

    this.createBackground(width, height, cx, cy);
    this.createTitle(cx, cy);
    this.createButtons(cx, cy);
    this.createFloatingPieces(width, height);
  }

  createBackground(width, height, cx, cy) {
    // Deep dark gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d0a1a, 0x0d0a1a, 0x1a0a3e, 0x1a0a3e, 1);
    bg.fillRect(0, 0, width, height);

    // Glowing orb
    const orb = this.add.graphics();
    orb.fillStyle(0x7c6af7, 0.08);
    orb.fillCircle(cx, cy - 80, 320);
    this.tweens.add({
      targets: orb, scaleX: 1.15, scaleY: 1.15,
      duration: 3000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // Stars
    for (let i = 0; i < 120; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const r = Phaser.Math.FloatBetween(0.5, 2.5);
      const a = Phaser.Math.FloatBetween(0.2, 0.9);
      const star = this.add.circle(x, y, r, 0xffffff, a);
      this.tweens.add({
        targets: star, alpha: { from: a, to: a * 0.2 },
        duration: Phaser.Math.Between(1200, 4000),
        yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 2000)
      });
    }

    // Board preview decorative (bottom)
    const boardPreview = this.add.graphics();
    const tileSize = 40;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const light = (r + c) % 2 === 0;
        boardPreview.fillStyle(light ? 0xf0d9b5 : 0xb58863, 0.06);
        boardPreview.fillRect(
          cx - 80 + c * tileSize, height - 100 + r * tileSize,
          tileSize, tileSize
        );
      }
    }
  }

  createTitle(cx, cy) {
    // Crown emoji decoration
    const crown = this.add.text(cx, cy - 200, '👑', { fontSize: '48px' }).setOrigin(0.5);
    this.tweens.add({
      targets: crown, y: cy - 210,
      duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // Main title
    const title = this.add.text(cx, cy - 140, 'CHIBI CHESS', {
      fontFamily: "'Cinzel', serif",
      fontSize: '56px',
      fontStyle: 'bold',
      color: '#f0d9b5',
      stroke: '#c9a227',
      strokeThickness: 3,
      shadow: { color: '#7c6af7', blur: 30, fill: true, offsetX: 0, offsetY: 0 }
    }).setOrigin(0.5);

    // Glow pulse on title
    this.tweens.add({
      targets: title, alpha: { from: 1, to: 0.85 },
      duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // Subtitle
    this.add.text(cx, cy - 82, '⚔  Cờ Vua Chibi Kỳ Ảo  ⚔', {
      fontFamily: "'Inter', sans-serif",
      fontSize: '18px',
      color: 'rgba(200,190,255,0.8)',
      letterSpacing: 3
    }).setOrigin(0.5);

    // Divider
    const div = this.add.graphics();
    div.fillStyle(0xc9a227, 0.6);
    div.fillRect(cx - 120, cy - 60, 240, 1);
  }

  createButtons(cx, cy) {
    const btnY = [cy + 20, cy + 90, cy + 160];
    const btnConfigs = [
      { label: '⚔  Chơi 2 Người (PvP)', key: 'pvp', color: 0x7c6af7, glow: 0x9080ff },
      { label: '🤖  Chơi với AI (Sớm...)', key: 'ai', color: 0x3a2a5a, glow: 0x5040a0, disabled: true },
      { label: '📖  Hướng Dẫn', key: 'help', color: 0x2a1a4a, glow: 0x4a3a7a }
    ];

    btnConfigs.forEach(({ label, key, color, glow, disabled }, idx) => {
      this.createButton(cx, btnY[idx], 320, 50, label, color, glow, disabled, () => {
        if (key === 'pvp') this.startPvP();
        if (key === 'help') this.showHelp();
      });
    });
  }

  createButton(x, y, w, h, label, color, glowColor, disabled = false, onClick) {
    const container = this.add.container(x, y);

    // Button background
    const bg = this.add.graphics();
    const drawBg = (hovered) => {
      bg.clear();
      bg.fillStyle(hovered ? glowColor : color, disabled ? 0.4 : 1);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
      bg.lineStyle(1.5, hovered ? 0xc9a227 : 0x5a4a8a, disabled ? 0.3 : 0.8);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
    };
    drawBg(false);

    // Label
    const text = this.add.text(0, 0, label, {
      fontFamily: "'Inter', sans-serif",
      fontSize: '17px',
      fontStyle: 'bold',
      color: disabled ? 'rgba(180,170,220,0.4)' : '#ffffff'
    }).setOrigin(0.5);

    container.add([bg, text]);

    if (!disabled) {
      container.setSize(w, h).setInteractive({ useHandCursor: true });
      container.on('pointerover', () => {
        drawBg(true);
        this.tweens.add({ targets: container, scaleX: 1.04, scaleY: 1.04, duration: 120 });
      });
      container.on('pointerout', () => {
        drawBg(false);
        this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 120 });
      });
      container.on('pointerdown', () => {
        this.tweens.add({ targets: container, scaleX: 0.96, scaleY: 0.96, duration: 80, yoyo: true });
        this.time.delayedCall(160, onClick);
      });
    }

    // Entrance animation
    container.setAlpha(0).setY(y + 20);
    this.tweens.add({
      targets: container, alpha: 1, y,
      duration: 500, delay: 200 + 120 * (this.children.list.length % 5),
      ease: 'Back.Out'
    });
  }

  createFloatingPieces(width, height) {
    // Show some chibi sprites floating in background
    const keys = ['white_queen', 'white_king', 'black_queen', 'black_king', 'white_knight', 'black_knight'];
    keys.forEach((key, i) => {
      if (!this.textures.exists(key)) return;
      const x = Phaser.Math.Between(40, width - 40);
      const y = Phaser.Math.Between(40, height - 40);
      const sprite = this.add.image(x, y, key)
        .setScale(0.18)
        .setAlpha(0.12)
        .setDepth(-1);

      this.tweens.add({
        targets: sprite,
        y: y - Phaser.Math.Between(15, 35),
        duration: Phaser.Math.Between(2000, 4000),
        yoyo: true, repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
        ease: 'Sine.easeInOut'
      });
    });
  }

  startPvP() {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene', { mode: 'pvp' });
    });
  }

  showHelp() {
    // Simple help overlay
    const { width, height } = this.scale;
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85).setDepth(10);
    const helpText = [
      '📖  HƯỚNG DẪN CHƠI',
      '',
      '• Click vào quân cờ để chọn',
      '• Các ô có chấm = nước đi hợp lệ',
      '• Click ô đích để di chuyển',
      '• Nút Undo để hoàn tác nước đi',
      '• Nút New Game để chơi lại',
      '',
      '🏆  Chiếu bí đối thủ để thắng!',
      '',
      '   [Click để đóng]'
    ].join('\n');

    const txt = this.add.text(width / 2, height / 2, helpText, {
      fontFamily: "'Inter', sans-serif",
      fontSize: '18px',
      color: '#f0e8d0',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5).setDepth(11);

    const close = () => { overlay.destroy(); txt.destroy(); };
    overlay.setInteractive().on('pointerdown', close);
    txt.setInteractive().on('pointerdown', close);
  }
}
