/**
 * 装备信息工具 - 提取红数和孔数
 *
 * 服务端 role_getroleinfo / rank_getroleinfo 可能不再返回完整 quenches 数据，
 * 因此需要根据装备等级推算总孔数，同时尽量从现有数据统计红数。
 */

/**
 * 根据装备等级计算解锁的孔位数
 * 咸鱼之王淬炼孔位解锁阈值：
 *   < 500: 0孔, 500-999: 1孔, 1000-1999: 2孔,
 *   2000-2999: 3孔, 3000-3999: 4孔, 4000+: 5孔
 */
function getSlotCountByLevel(level) {
  if (level == null) return 0;
  if (level >= 4000) return 5;
  if (level >= 3000) return 4;
  if (level >= 2000) return 3;
  if (level >= 1000) return 2;
  if (level >= 500) return 1;
  return 0;
}

/**
 * 获取一件装备的红孔数和总孔数
 * @param {Object} equip - 单件装备对象
 * @returns {{ redCount: number, holeCount: number }}
 */
function countEquipHoles(equip) {
  if (!equip) return { redCount: 0, holeCount: 0 };

  let redCount = 0;

  // 从 quenches 和 quenches2 统计红数
  [equip.quenches, equip.quenches2].forEach((quenchObj) => {
    if (quenchObj) {
      Object.values(quenchObj).forEach((item) => {
        if (item?.colorId === 6) {
          redCount++;
        }
      });
    }
  });

  // 总孔数 = max(quenches条目, quenches2条目, 等级推算)
  const q1Len = equip.quenches ? Object.keys(equip.quenches).length : 0;
  const q2Len = equip.quenches2 ? Object.keys(equip.quenches2).length : 0;
  const levelSlots = getSlotCountByLevel(equip.level);

  const holeCount = Math.max(q1Len, q2Len, levelSlots);

  return { redCount, holeCount };
}

/**
 * 获取英雄装备的红孔数和总孔数
 * @param {Object} equipment - 英雄的装备对象 { partId: equipObj }
 * @returns {{ redCount: number, holeCount: number }}
 */
export function getEquipment(equipment) {
  let redCount = 0;
  let holeCount = 0;

  if (!equipment) return { redCount, holeCount };

  Object.values(equipment).forEach((equ) => {
    const info = countEquipHoles(equ);
    redCount += info.redCount;
    holeCount += info.holeCount;
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
