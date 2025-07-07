const video = document.getElementById('video');
const strip = document.getElementById('strip');
const flash = document.getElementById('flash');
const filterButtons = document.querySelectorAll('.filter-btn');

let currentFilter = 'none';
let captures = [];

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter;
    applyVideoFilter(currentFilter);
  });
});


// Access webcam
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
    video.play();
  });

// Set filter button active state
filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    applyVideoFilter(currentFilter);
  });
});

function applyVideoFilter(filterName) {
  const video = document.getElementById('video');

  const cssFilters = {
    'none': 'none',
    'bw_movie': 'grayscale(1) contrast(1.3)',
    'bright_day': 'brightness(1.15) contrast(1.05)',
    'inkwell': 'grayscale(1) contrast(2)',
    'foodie': 'saturate(1.4) brightness(1.05)',
    'dreamy': 'contrast(0.8) brightness(1.1) sepia(0.1)',
    'vhs': 'contrast(0.9) saturate(0.8) hue-rotate(10deg)'
  };

  video.style.filter = cssFilters[filterName] || 'none';
}
function triggerFlash() {
  flash.style.opacity = '1';
  setTimeout(() => {
    flash.style.opacity = '0';
  }, 150);
}

function applyCanvasFilter(ctx, imageData, type) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i], g = data[i + 1], b = data[i + 2];

    switch (type) {
      case 'bw_movie': {
        const avg = (r + g + b) / 3;
        r = g = b = avg;
        r *= 1.2; // stronger contrast
        break;
      }
      case 'bright_day': {
        r = r * 1.1 + 10;
        g = g * 1.1 + 10;
        b = b * 1.05 + 5;
        break;
      }
      case 'inkwell': {
        const avg = (r + g + b) / 3;
        r = g = b = avg > 128 ? 255 : 0;
        break;
      }
      case 'foodie': {
        r *= 1.3;
        g *= 1.15;
        b *= 0.9;
        break;
      }
      case 'dreamy': {
        r = r * 1.1 + 20;
        g = g * 1.05 + 10;
        b = b * 1.1 + 30;
        break;
      }
      case 'vhs': {
        r = r * 0.9;
        g = g * 0.9;
        b = b * 1.1 + 10;
        break;
      }
    }

    data[i]     = Math.min(255, Math.max(0, r));
    data[i + 1] = Math.min(255, Math.max(0, g));
    data[i + 2] = Math.min(255, Math.max(0, b));
  }

  ctx.putImageData(imageData, 0, 0);
}

function overlayTexture(ctx, canvas, textureImg) {
  const texture = new Image();
  texture.src = textureImg;
  texture.onload = () => {
    ctx.drawImage(texture, 0, 0, canvas.width, canvas.height);
  };
}

function takePhoto() {
  const canvas = document.createElement('canvas');
  const width = video.videoWidth;
  const height = video.videoHeight;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, width, height);
  let imageData = ctx.getImageData(0, 0, width, height);
  applyCanvasFilter(ctx, imageData, currentFilter);

// Optional texture per style
if (['60s', '70s', '80s'].includes(currentFilter)) {
  overlayTexture(ctx, canvas, 'assets/film-grain.png');
}


  // Create small version for strip
  const small = document.createElement('canvas');
  small.width = 160;
  small.height = 120;
  const sctx = small.getContext('2d');
  sctx.drawImage(canvas, 0, 0, small.width, small.height);

  strip.appendChild(small);
  captures.push(canvas); // Save full-size for download
  triggerFlash();
}


function downloadStrip() {
  if (captures.length === 0) return;

  const photoCount = captures.length;
  const padding = 30;
  const spacing = 20;
  const imageWidth = captures[0].width;
  const imageHeight = captures[0].height;

  const footerHeight = 100;

  const totalHeight = photoCount * imageHeight + (photoCount - 1) * spacing + footerHeight + padding * 2;

  const canvas = document.createElement('canvas');
  canvas.width = imageWidth + padding * 2;
  canvas.height = totalHeight;

  const ctx = canvas.getContext('2d');

  // Background white
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw photos
  captures.forEach((photo, i) => {
    const y = padding + i * (imageHeight + spacing);
    ctx.drawImage(photo, padding, y, imageWidth, imageHeight);
  });

  // Text footer
  ctx.fillStyle = '#000000';
  ctx.font = '20px Georgia';
  ctx.textAlign = 'center';

  const centerX = canvas.width / 2;
  const textY = canvas.height - footerHeight + 30;

  ctx.fillText('MOMENTS', centerX, textY);
  ctx.font = 'italic 18px Georgia';
  ctx.fillText('and', centerX, textY + 25);
  ctx.font = '20px Georgia';
  ctx.fillText('MEMORIES', centerX, textY + 50);

  const link = document.createElement('a');
  link.download = 'photo_strip.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}
