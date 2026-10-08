// ============================================================
// PreloadScene.js — Load all assets + show loading screen
// ============================================================
import { SpriteUtils } from '../utils/SpriteUtils.js';

export class PreloadScene extends Phaser.Scene {
  constructor() { super({ key: 'PreloadScene' }); }

  preload() {
    const { width, height } = this.scale;
    this.createLoadingUI(width, height);

    // Progress bar
    this.load.on('progress', (value) => {
      if (this.progressBar) {
        this.progressBar.clear();
        this.progressBar.fillStyle(0x7c6af7, 1);
        this.progressBar.fillRoundedRect(width / 2 - 200, height / 2 + 22, 400 * value, 14, 7);
      }
      if (this.progressText) {
        this.progressText.setText(`${Math.floor(value * 100)}%`);
      }
    });

    this.load.on('complete', () => {
      if (this.progressText) this.progressText.setText('100%');
      if (this.loadingLabel) this.loadingLabel.setText('Hoàn Tất!');
    });

    // ---- Piece atlas images ----
    this.load.image('white_team_atlas', 'assets/pieces/white/white_team.jpg');
    this.load.image('black_team_atlas', 'assets/pieces/black/black_team.jpg');

    // ---- Particle ----
    this.load.image('particle', this.makeParticleDataURL());
  }

  create() {
    // Slice sprites from team atlas
    SpriteUtils.sliceTeamAtlas(this, 'white_team_atlas', 'white', true);
    SpriteUtils.sliceTeamAtlas(this, 'black_team_atlas', 'black', false);

    // Short delay for loading screen visibility
    this.time.delayedCall(600, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });
  }

  createLoadingUI(width, height) {
    const cx = width / 2, cy = height / 2;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d0a1a, 0x0d0a1a, 0x1a0a3e, 0x1a0a3e, 1);
    bg.fillRect(0, 0, width, height);

    // Stars
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.FloatBetween(0.5, 2);
      const alpha = Phaser.Math.FloatBetween(0.2, 0.8);
      const star = this.add.circle(x, y, size, 0xffffff, alpha);
      this.tweens.add({
        targets: star, alpha: { from: alpha, to: alpha * 0.2 },
        duration: Phaser.Math.Between(1000, 3000), yoyo: true, repeat: -1
      });
    }

    // Logo crown
    const crown = this.add.text(cx, cy - 120, '👑', { fontSize: '50px' }).setOrigin(0.5);
    this.tweens.add({ targets: crown, y: cy - 130, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Title
    this.add.text(cx, cy - 60, 'CHIBI CHESS', {
      fontFamily: "'Cinzel', serif",
      fontSize: '46px', fontStyle: 'bold',
      color: '#f0d9b5',
      stroke: '#c9a227', strokeThickness: 2,
      shadow: { color: '#7c6af7', blur: 25, fill: true }
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(cx, cy - 10, 'Cờ Vua Chibi Kỳ Ảo', {
      fontFamily: "'Inter', sans-serif", fontSize: '16px', color: 'rgba(200,190,255,0.7)'
    }).setOrigin(0.5);

    // Bar background
    this.add.graphics().fillStyle(0x1a1232, 1).fillRoundedRect(cx - 202, cy + 20, 404, 16, 8)
      .lineStyle(1, 0x3a2a5a, 1).strokeRoundedRect(cx - 202, cy + 20, 404, 16, 8);

    // Progress fill
    this.progressBar = this.add.graphics();

    // Labels
    this.loadingLabel = this.add.text(cx, cy + 50, 'Đang tải tài nguyên...', {
      fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(180,170,255,0.7)'
    }).setOrigin(0.5);
    this.progressText = this.add.text(cx, cy + 70, '0%', {
      fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(150,140,200,0.6)'
    }).setOrigin(0.5);

    // Animated dots for "loading..."
    let dots = 0;
    this.time.addEvent({
      delay: 400, repeat: -1, callback: () => {
        dots = (dots + 1) % 4;
        if (this.loadingLabel?.active) {
          this.loadingLabel.setText('Đang tải tài nguyên' + '.'.repeat(dots));
        }
      }
    });
  }

  makeParticleDataURL() {
    const c = document.createElement('canvas');
    c.width = 32; c.height = 32;
    const ctx = c.getContext('2d');
    const grd = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.3, 'rgba(200,180,255,0.8)');
    grd.addColorStop(1, 'rgba(100,80,200,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 32, 32);
    return c.toDataURL();
  }
}
