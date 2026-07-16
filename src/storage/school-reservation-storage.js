const SCHOOL_CLASS_LIST_KEY = 'schoolClassList';
const SCHOOL_RESERVATION_LIST_KEY = 'schoolReservationList';

const fallbackSchoolClasses = [
  {
    id: '1',
    name: '소형견반',
    manager: '조혈',
    capacity: 2,
    businessDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
  },
  {
    id: '2',
    name: '뛰뛰반',
    manager: '조혈',
    capacity: 2,
    businessDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
  },
];

function readList(key, fallbackValue) {
  try {
    const storedValue = window.localStorage.getItem(key);
    const parsedValue = storedValue ? JSON.parse(storedValue) : null;

    return Array.isArray(parsedValue) ? parsedValue : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

function addMissingReservationCreatedAt(reservation) {
  if (reservation.createdAt) return reservation;

  return {
    ...reservation,
    createdAt: `${reservation.date ?? '2025-01-01'}T14:35:00`,
  };
}

export function getSchoolReservationData() {
  return {
    schoolClassList: readList(SCHOOL_CLASS_LIST_KEY, fallbackSchoolClasses),
    schoolReservationList: readList(SCHOOL_RESERVATION_LIST_KEY, []).map(addMissingReservationCreatedAt),
  };
}

export function saveSchoolReservationList(schoolReservationList) {
  window.localStorage.setItem(SCHOOL_RESERVATION_LIST_KEY, JSON.stringify(schoolReservationList));
}
