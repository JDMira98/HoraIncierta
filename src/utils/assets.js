import Tunel from '../images/Tunel.png';
import TunelFinal from '../images/TunelFinal.png';
import Desierto from '../images/Desierto.png';
import Pasillo from '../images/Pasillo.png';
import Jardi from '../images/Jardi.png';
import Texturas from '../images/Texturas.png';

const imageMap = {
  'Tunel.png': Tunel,
  'TunelFinal.png': TunelFinal,
  'Desierto.png': Desierto,
  'Pasillo.png': Pasillo,
  'Jardi.png': Jardi,
  'Texturas.png': Texturas,
};

export const getImageAsset = (filename) => {
  if (!filename) {
    return Texturas;
  }

  return imageMap[filename] ?? Texturas;
};
