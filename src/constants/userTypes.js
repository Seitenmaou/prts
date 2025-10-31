const elevatedUserTypes = ['admin', 'welcomefrompriestess', 'welcomefromcivilight'];

export const ELEVATED_USER_TYPES = Object.freeze([...elevatedUserTypes]);

const elevatedUserTypeSet = new Set(elevatedUserTypes);

export const isElevatedUserType = (userType) => (
  typeof userType === 'string' && elevatedUserTypeSet.has(userType)
);

