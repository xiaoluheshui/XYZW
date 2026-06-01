/**
 * 装备信息工具 - 提取红数和孔数
 * 解决服务端 quenches 只返回红孔时孔数=红数的问题
 */

// 装备对象上可能的孔数字段名（按优先级排列）
const HOLE_COUNT_KEYS = [
  "quenchSlotNum",
  "slotCount",
  "openSlotCount",
  "maxSlot",
  "holeCount",
  "quenchNum",
];

/**
 * 获取装备的红孔数和总孔数
 * @param {Object} equipment - 英雄的装备对象
 * @returns {{ redCount: number, holeCount: number }}
 */
export function getEquipment(equipment) {
  let redCount = 0;
  let holeCount = 0;

  if (!equipment) return { redCount, holeCount };

  Object.values(equipment).forEach((equ) => {
    if (!equ) return;

    // 1. 从 quenches 统计红数
    let quenchHoleCount = 0;
    if (equ.quenches) {
      Object.values(equ.quenches).forEach((item) => {
        quenchHoleCount++;
        if (item?.colorId === 6) {
          redCount++;
        }
      });
    }

    // 2. 尝试直接读孔数字段
    let directHoleCount = null;
    for (const key of HOLE_COUNT_KEYS) {
      if (equ[key] != null && typeof equ[key] === "number" && equ[key] > 0) {
        directHoleCount = equ[key];
        break;
      }
    }

    // 3. 取两者最大值作为总孔数（服务端若只返回红孔，direct字段会更大）
    if (directHoleCount != null && directHoleCount > quenchHoleCount) {
      holeCount += directHoleCount;
    } else {
      holeCount += quenchHoleCount;
    }
  });

  return { redCount, holeCount };
}

/**
 * 提取英雄列表的红数和孔数
 * @param {Object} heroObj - heroes 对象
 * @param {Object} heroDict  - 英雄字典 { heroId: { name, avatar } }
 * @returns {{ redCount: number, holeCount: number, heroList: Array }}
 */
export function getHeroInfo(heroObj, heroDict = {}) {
  let redCount = 0;
  let holeCount = 0;
  const heroList = [];

  if (!heroObj) return { redCount, holeCount, heroList };

  const heroesToProcess = Array.isArray(heroObj)
    ? heroObj
    : Object.values(heroObj);

  heroesToProcess.forEach((hero) => {
    if (!hero?.heroId) return;

    const heroInfo = heroDict[hero.heroId] || {};
    const equipmentInfo = getEquipment(hero.equipment);

    const tempObj = {
      heroId: hero.heroId,
      heroSort: hero.battleTeamSlot,
      artifactId: hero.artifactId,
      power: hero.power,
      star: hero.star,
      heroName: heroInfo.name || `武将${hero.heroId}`,
      heroAvate: heroInfo.avatar,
      level: hero.level,
      hole: equipmentInfo.holeCount,
      red: equipmentInfo.redCount,
      HolyBeast: hero.hB?.active,
      HBlevel: hero.hB?.order || 0,
    };

    redCount += tempObj.red;
    holeCount += tempObj.hole;
    heroList.push(tempObj);
  });

  return {
    redCount,
    holeCount,
    heroList: heroList.sort((a, b) => (a.heroSort || 0) - (b.heroSort || 0)),
  };
}
