import { createCanvas, type CanvasRenderingContext2D, registerFont } from 'canvas';
import interFontUrl from '$lib/fonts/Inter-VariableFont_opsz,wght.ttf';
import path from 'path';
import { fileURLToPath } from 'url';

function resolveAsset(url: string): string {
  if (import.meta.env.PROD) {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const serverRoot = here.split(path.sep + 'entries' + path.sep)[0] + path.sep + 'server';
    return path.join(serverRoot, url.replace(/^\//, ''));
  }

  return path.resolve(process.cwd(), url.slice(1));
}

const interFontPath = resolveAsset(interFontUrl);

export class MatchResultImageGenerator {
  private readonly width = 1200;
  private readonly height = 627;
  private readonly bgColor = '#1b1f21';
  private readonly textColor = '#ffffff';
  private readonly gold = '#c4a04a';
  private readonly font = 'Inter';

  public constructor(maps: string) {
    registerFont(interFontPath, { family: 'Inter' });
  }

  public async create(id: string, mode: string, map: string, winner: string) {
    const canvas = createCanvas(this.width, this.height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = this.bgColor;
    ctx.fillRect(0, 0, this.width, this.height);

    // Title
    this.drawCenteredText(ctx, 'MATCH RESULTS', `bold 96px '${this.font}'`, 90);
    this.drawCenteredText(ctx, `${mode === 'ffa' ? 'FFA' : mode} · ${map}`, `32px '${this.font}'`, 160);

    // Winner
    const hexCenterY = 370;
    this.drawWinnerHex(ctx, this.width / 2, hexCenterY, 160);
    this.drawCenteredText(ctx, 'WINNER', `bold 44px '${this.font}'`, hexCenterY - 45);
    this.drawCenteredText(ctx, winner, `bold 90px '${this.font}'`, hexCenterY + 25);

    // Footer
    this.drawCenteredText(ctx, `${id} @ mirv.world`, `36px '${this.font}'`, this.height - 60, '#A8A8A8');

    return canvas.toBuffer('image/jpeg', {
      quality: 80,
    });
  }

  private drawCenteredText(
    ctx: CanvasRenderingContext2D,
    text: string,
    font: string,
    y: number,
    color = this.textColor,
  ) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, this.width / 2, y);
  }

  private drawWinnerHex(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) {
    ctx.strokeStyle = this.gold;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const px = centerX + radius * Math.cos(angle);
      const py = centerY + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  }
}
