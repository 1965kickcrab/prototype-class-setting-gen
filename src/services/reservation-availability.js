const DAY_KEY_BY_INDEX = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const SCHOOL_BUSINESS_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];

export const UNASSIGNED_CLASS_ID = 'unassigned';
export const UNASSIGNED_CLASS = {
  id: UNASSIGNED_CLASS_ID,
  name: '소속 클래스 없음',
  capacity: null,
  businessDays: SCHOOL_BUSINESS_DAYS,
};

export function getPetRemainingCount(pet) {
  return Number(pet.totalReservableCountByType?.school ?? 0);
}

export function getPetClassIds(pet) {
  const classIds = Array.isArray(pet.schoolClassIds)
    ? pet.schoolClassIds.filter(Boolean)
    : [];

  return classIds.length > 0 ? classIds : [UNASSIGNED_CLASS_ID];
}

export function getReservationClass(schoolClassList, classId) {
  if (classId === UNASSIGNED_CLASS_ID) return UNASSIGNED_CLASS;

  return schoolClassList.find((schoolClass) => schoolClass.id === classId);
}

export function getSharedClassIds(pets, selectedPetIds) {
  const selectedPets = pets.filter((pet) => selectedPetIds.has(pet.id));

  if (selectedPets.length === 0) return [];

  return getPetClassIds(selectedPets[0]).filter((classId) => (
    selectedPets.every((pet) => getPetClassIds(pet).includes(classId))
  ));
}

export function canSelectPet(pets, selectedPetIds, pet) {
  if (getPetRemainingCount(pet) === 0 || getPetClassIds(pet).length === 0) return false;
  if (selectedPetIds.has(pet.id)) return true;

  return getSharedClassIds(pets, new Set([...selectedPetIds, pet.id])).length > 0;
}

export function getSelectedPetAvailability(pets, schoolClassList, schoolReservationList, selectedPetIds, selectedClassId, dateKey) {
  const selectedPets = pets.filter((pet) => selectedPetIds.has(pet.id));
  const selectedClass = getReservationClass(schoolClassList, selectedClassId);
  const sharedClassIds = getSharedClassIds(pets, selectedPetIds);

  if (selectedPets.length === 0 || !selectedClass || !sharedClassIds.includes(selectedClassId)) {
    return { status: 'unavailable' };
  }

  const date = new Date(`${dateKey}T00:00:00`);
  const dayKey = DAY_KEY_BY_INDEX[date.getDay()];
  const hasBusinessDay = selectedClass.businessDays?.includes(dayKey);
  const hasExistingReservation = selectedPets.some((pet) => schoolReservationList.some((reservation) => (
    reservation.status !== '취소'
    && reservation.petId === pet.id
    && reservation.date === dateKey
  )));
  const reservationCount = schoolReservationList.filter((reservation) => (
    reservation.status !== '취소'
    && reservation.classId === selectedClassId
    && reservation.date === dateKey
  )).length;
  const hasFullClass = reservationCount + selectedPets.length > Number(selectedClass.capacity ?? Infinity);

  if (!hasBusinessDay || hasExistingReservation) {
    return { status: 'unavailable' };
  }

  if (hasFullClass) {
    return { status: 'full' };
  }

  return { status: 'available' };
}
