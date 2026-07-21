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

export function resolveSchoolClassName(record, schoolClassList) {
  const currentClass = schoolClassList.find((schoolClass) => schoolClass.id === record.classId);

  // 클래스 수정/삭제 UI는 이 프로토타입의 범위 밖이다. classId로 현재 이름을 우선 연결하고,
  // 클래스가 삭제되어 조회되지 않을 때만 생성 시점에 저장한 이름을 스냅샷으로 사용한다.
  return currentClass?.name ?? record.classSnapshot?.name ?? record.className ?? null;
}

export function getSchoolClassList() {
  return readList(SCHOOL_CLASS_LIST_KEY, fallbackSchoolClasses);
}

export function getSchoolReservationData() {
  const schoolClassList = getSchoolClassList();
  const schoolReservationList = readList(SCHOOL_RESERVATION_LIST_KEY, [])
    .map(addMissingReservationCreatedAt)
    .map((reservation) => ({
      ...reservation,
      className: resolveSchoolClassName(reservation, schoolClassList),
    }));

  return {
    schoolClassList,
    schoolReservationList,
  };
}

export function saveSchoolReservationList(schoolReservationList) {
  window.localStorage.setItem(SCHOOL_RESERVATION_LIST_KEY, JSON.stringify(schoolReservationList));
}
