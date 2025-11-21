/**
 * 解析 PDB 文件内容，提取原子坐标和功能位点信息
 * @param {string} pdbContent - PDB 文件的原始文本内容
 * @returns {Object} 包含 atoms, hetatms 的对象
 */
export function parsePDB(pdbContent) {
  const lines = pdbContent.split('\n');
  const atoms = [];
  const hetatms = [];

  for (const line of lines) {
    const recordType = line.substring(0, 6).trim();
    if (recordType === 'ATOM') {
      const x = parseFloat(line.substring(30, 38).trim());
      const y = parseFloat(line.substring(38, 46).trim());
      const z = parseFloat(line.substring(46, 54).trim());
      const element = line.substring(76, 78).trim();
      const atomName = line.substring(12, 16).trim().replace(/\s/g, '');
      const residueName = line.substring(17, 20).trim();
      const chainId = line.substring(21, 22).trim();
      const residueSeq = parseInt(line.substring(22, 26).trim());

      if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
        atoms.push({
          x, y, z, element, atomName, residueName, chainId, residueSeq
        });
      }
    } else if (recordType === 'HETATM') {
      const x = parseFloat(line.substring(30, 38).trim());
      const y = parseFloat(line.substring(38, 46).trim());
      const z = parseFloat(line.substring(46, 54).trim());
      const element = line.substring(76, 78).trim();
      const atomName = line.substring(12, 16).trim().replace(/\s/g, '');
      const residueName = line.substring(17, 20).trim();
      const chainId = line.substring(21, 22).trim();
      const residueSeq = parseInt(line.substring(22, 26).trim());

      if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
        hetatms.push({
          x, y, z, element, atomName, residueName, chainId, residueSeq
        });
      }
    }
  }

  // 对原子数据进行归一化处理
  const normalizedAtoms = normalizeCoordinatesForAtoms(atoms);
  const normalizedHetatms = normalizeCoordinatesForAtoms(hetatms);

  return {
    atoms: normalizedAtoms,
    hetatms: normalizedHetatms
  };
}

/**
 * 归一化坐标，使其居中并缩放到合适的大小
 * @param {Array} atomArray - 原子数组
 * @returns {Array} 归一化后的原子数组
 */
function normalizeCoordinatesForAtoms(atomArray) {
  if (atomArray.length === 0) {
    return atomArray;
  }

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (const atom of atomArray) {
    minX = Math.min(minX, atom.x);
    minY = Math.min(minY, atom.y);
    minZ = Math.min(minZ, atom.z);
    maxX = Math.max(maxX, atom.x);
    maxY = Math.max(maxY, atom.y);
    maxZ = Math.max(maxZ, atom.z);
  }

  const sizeX = maxX - minX;
  const sizeY = maxY - minY;
  const sizeZ = maxZ - minZ;
  const maxSize = Math.max(sizeX, sizeY, sizeZ);

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;

  const scale = maxSize > 0 ? 8 / maxSize : 1;

  return atomArray.map(atom => ({
    ...atom,
    x: (atom.x - centerX) * scale,
    y: (atom.y - centerY) * scale,
    z: (atom.z - centerZ) * scale
  }));
}

export async function fetchPDB(pdbId) {
  const url = `https://files.rcsb.org/download/${pdbId}.pdb`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const pdbContent = await response.text();
    return pdbContent;
  } catch (error) {
    console.error(`Failed to fetch PDB file for ID: ${pdbId}`, error);
    throw error;
  }
}