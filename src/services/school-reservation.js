import {
  decreaseSchoolRemainingCount,
  getStoredMembers,
  updateSchoolTicketCounts,
} from '../storage/member-storage.js';
import { getSchoolReservationData, saveSchoolReservationList } from '../storage/school-reservation-storage.js';
import { getSelectedPetAvailability } from './reservation-availability.js';

function createReservationId() {
  if (window.crypto?.randomUUID) return `school-reservation-${window.crypto.randomUUID()}`;

  return `school-reservation-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createReservationGroupId() {
  if (window.crypto?.randomUUID) return `school-reservation-group-${window.crypto.randomUUID()}`;

  return `school-reservation-group-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getTodayKey() {
  const today = new Date();

  return [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
}

function createReservation({ guardian, pet, schoolClass, date, reservationId, createdAt }) {
  return {
    id: createReservationId(),
    reservationId,
    createdAt,
    date,
    status: '예약',
    businessName: '다이얼독 유치원',
    serviceType: '유치원',
    classId: schoolClass.id,
    className: schoolClass.name,
    classSnapshot: {
      id: schoolClass.id,
      name: schoolClass.name,
      capacity: schoolClass.capacity ?? null,
    },
    memberId: guardian.id,
    petId: pet.id,
    petName: pet.petName,
    breed: pet.breed ?? '',
    ticketName: pet.ticketName ?? '유치원 이용권',
    guardianName: guardian.guardianName,
    phoneNumber: guardian.phoneNumber ?? '',
    address: guardian.address ?? '',
    addressDetail: guardian.addressDetail ?? '',
    ownerTags: guardian.ownerTags ?? [],
    petTags: pet.petTags ?? [],
    birthDate: pet.birthDate ?? '',
    animalRegistrationNumber: pet.animalRegistrationNumber ?? '',
    coatColor: pet.coatColor ?? '',
    weight: pet.weight ?? '',
    gender: pet.gender ?? '선택 안함',
    neuteredStatus: pet.neuteredStatus ?? '',
    memo: pet.memo ?? '',
    totalReservableCount: Number(pet.totalReservableCountByType?.school ?? 0),
  };
}

export function createSchoolReservations({ memberId, petIds, classId, dateKeys }) {
  const { schoolClassList, schoolReservationList } = getSchoolReservationData();
  const guardian = getStoredMembers().find((member) => member.id === memberId);
  const selectedPets = guardian?.pets.filter((pet) => petIds.includes(pet.id)) ?? [];
  const selectedPetIds = new Set(selectedPets.map((pet) => pet.id));
  const schoolClass = schoolClassList.find((item) => item.id === classId);
  const uniqueDateKeys = [...new Set(dateKeys)].sort();
  const todayKey = getTodayKey();

  if (!guardian || !schoolClass || selectedPets.length !== petIds.length || uniqueDateKeys.length === 0) {
    return { ok: false, message: '예약 정보를 다시 확인해주세요.' };
  }

  const requiredCount = uniqueDateKeys.length;
  if (selectedPets.some((pet) => Number(pet.totalReservableCountByType?.school ?? 0) < requiredCount)) {
    return { ok: false, message: '예약 가능한 이용권 횟수가 부족합니다.' };
  }

  const unavailableDate = uniqueDateKeys.find((dateKey) => (
    dateKey < todayKey
    || getSelectedPetAvailability(
      guardian.pets,
      schoolClassList,
      schoolReservationList,
      selectedPetIds,
      classId,
      dateKey,
    ).status !== 'available'
  ));

  if (unavailableDate) return { ok: false, message: `${unavailableDate}에는 예약할 수 없습니다.` };

  const reservationId = createReservationGroupId();
  const createdAt = new Date().toISOString();
  const reservations = uniqueDateKeys.flatMap((date) => (
    selectedPets.map((pet) => createReservation({ guardian, pet, schoolClass, date, reservationId, createdAt }))
  ));

  saveSchoolReservationList([...schoolReservationList, ...reservations]);
  updateSchoolTicketCounts(memberId, [...selectedPetIds], requiredCount);

  return { ok: true, reservations };
}

export function cancelSchoolReservations(reservationIds) {
  const { schoolReservationList } = getSchoolReservationData();
  const targetReservationIds = new Set(reservationIds);
  const reservations = schoolReservationList.filter((item) => targetReservationIds.has(item.id));
  const todayKey = getTodayKey();

  if (targetReservationIds.size === 0 || reservations.length !== targetReservationIds.size || reservations.some((reservation) => reservation.status === '취소')) {
    return { ok: false, message: '취소할 예약을 찾을 수 없습니다.' };
  }

  if (reservations.some((reservation) => reservation.date <= todayKey)) {
    return { ok: false, message: '예약일 전까지만 예약을 취소할 수 있습니다.' };
  }

  const updatedReservations = schoolReservationList.map((item) => (
    targetReservationIds.has(item.id) ? { ...item, status: '취소' } : item
  ));

  saveSchoolReservationList(updatedReservations);
  reservations.forEach((reservation) => {
    updateSchoolTicketCounts(reservation.memberId, [reservation.petId], -1);
  });

  return { ok: true, reservations: reservations.map((reservation) => ({ ...reservation, status: '취소' })) };
}

export function cancelSchoolReservation(reservationId) {
  const result = cancelSchoolReservations([reservationId]);

  return result.ok
    ? { ok: true, reservation: result.reservations[0] }
    : result;
}

const APPLIED_ATTENDANCE_IDS_KEY = 'schoolReservationAttendanceAppliedIds';

function getAppliedAttendanceIds() {
  try {
    const storedValue = window.localStorage.getItem(APPLIED_ATTENDANCE_IDS_KEY);
    const parsedValue = storedValue ? JSON.parse(storedValue) : [];

    return new Set(Array.isArray(parsedValue) ? parsedValue : []);
  } catch {
    return new Set();
  }
}

export function applyPastSchoolReservationAttendance() {
  const { schoolReservationList } = getSchoolReservationData();
  const appliedReservationIds = getAppliedAttendanceIds();
  const todayKey = getTodayKey();
  const completedReservations = schoolReservationList.filter((reservation) => (
    reservation.status === '예약'
    && reservation.date < todayKey
    && !appliedReservationIds.has(reservation.id)
  ));

  completedReservations.forEach((reservation) => {
    decreaseSchoolRemainingCount(reservation.memberId, reservation.petId);
    appliedReservationIds.add(reservation.id);
  });

  if (completedReservations.length > 0) {
    window.localStorage.setItem(APPLIED_ATTENDANCE_IDS_KEY, JSON.stringify([...appliedReservationIds]));
  }

  return completedReservations.length;
}
