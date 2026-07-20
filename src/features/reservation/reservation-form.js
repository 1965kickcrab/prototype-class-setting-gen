import { getStoredMembers } from '../../storage/member-storage.js';
import { getSchoolReservationData } from '../../storage/school-reservation-storage.js';
import {
  canSelectPet,
  getPetRemainingCount,
  getSelectedPetAvailability,
  getSharedClassIds,
} from '../../services/reservation-availability.js';
import {
  applyPastSchoolReservationAttendance,
  createSchoolReservations,
} from '../../services/school-reservation.js';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function toDateKey(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

function formatMonth(date) {
  return `${date.getFullYear()}. ${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function createReservationForm(root, { onClose } = {}) {
  applyPastSchoolReservationAttendance();
  const guardian = getStoredMembers().find((member) => member.guardianName === '김민지');
  const { schoolClassList, schoolReservationList } = getSchoolReservationData();
  const pets = guardian?.pets ?? [];
  const today = new Date();
  const state = {
    displayedMonth: new Date(today.getFullYear(), today.getMonth(), 1),
    selectedPetIds: new Set(),
    selectedClassId: null,
    selectedDates: new Set(),
  };

  const petList = root.querySelector('[data-field="pet-list"]');
  const monthLabel = root.querySelector('[data-field="reservation-month-label"]');
  const daysContainer = root.querySelector('[data-field="reservation-calendar-days"]');
  const selectedDateCount = root.querySelector('[data-field="selected-date-count"]');
  const remainingCount = root.querySelector('[data-field="remaining-count"]');
  const submitButton = root.querySelector('[data-action="submit-reservation"]');
  const notice = root.querySelector('.reservation-form__notice');
  const footer = root.querySelector('.reservation-form__footer');
  const classSelector = root.querySelector('[data-action="open-class-selection"]');
  const selectedClassName = root.querySelector('[data-field="selected-class-name"]');
  const classOptions = root.querySelector('[data-field="class-options"]');
  const classSelectionSheet = root.querySelector('.class-selection-sheet');

  notice.hidden = pets.length <= 1;

  function getRemainingLimit() {
    const selectedPets = pets.filter((pet) => state.selectedPetIds.has(pet.id));

    return selectedPets.length > 0 ? Math.min(...selectedPets.map(getPetRemainingCount)) : 0;
  }

  function renderSummary() {
    const remaining = getRemainingLimit();
    selectedDateCount.textContent = `${state.selectedDates.size}회`;
    remainingCount.textContent = `${remaining}회`;
    submitButton.disabled = state.selectedPetIds.size === 0 || !state.selectedClassId || state.selectedDates.size === 0;
    footer.hidden = state.selectedPetIds.size === 0;
  }

  function renderPets() {
    petList.innerHTML = pets.map((pet) => {
      const remaining = getPetRemainingCount(pet);
      const isSelected = state.selectedPetIds.has(pet.id);
      const disabled = !canSelectPet(pets, state.selectedPetIds, pet);

      return `
        <button class="pet-selector__item surface-card${isSelected ? ' surface-card--selected pet-selector__item--selected' : ''}" type="button" data-action="toggle-pet" data-pet-id="${pet.id}" ${disabled ? 'disabled' : ''} aria-pressed="${isSelected}">
          <span class="pet-selector__check" aria-hidden="true">${isSelected ? '✓' : ''}</span>
          <span class="pet-selector__name">${pet.petName}</span>
          <span class="pet-selector__count">${remaining}회 예약 가능</span>
        </button>
      `;
    }).join('');
  }

  function getAvailableClasses() {
    const sharedClassIds = getSharedClassIds(pets, state.selectedPetIds);

    return schoolClassList.filter((schoolClass) => sharedClassIds.includes(schoolClass.id));
  }

  function renderClassSelection() {
    const availableClasses = getAvailableClasses();
    const selectedClass = availableClasses.find((schoolClass) => schoolClass.id === state.selectedClassId);

    classSelector.disabled = state.selectedPetIds.size === 0 || availableClasses.length === 0;
    selectedClassName.textContent = selectedClass?.name ?? (state.selectedPetIds.size === 0 ? '반려견을 먼저 선택해주세요' : '클래스를 선택해주세요');
    classOptions.innerHTML = availableClasses.map((schoolClass) => `
      <button class="class-selection-sheet__option${schoolClass.id === state.selectedClassId ? ' class-selection-sheet__option--selected' : ''}" type="button" data-action="select-class" data-class-id="${schoolClass.id}" aria-pressed="${schoolClass.id === state.selectedClassId}">
        <span>${schoolClass.name}</span><span class="class-selection-sheet__check${schoolClass.id === state.selectedClassId ? ' class-selection-sheet__check--selected' : ''}" aria-hidden="true">${schoolClass.id === state.selectedClassId ? '✓' : ''}</span>
      </button>
    `).join('');
  }

  function getDateStatus(dateKey) {
    const todayKey = toDateKey(today);

    if (dateKey < todayKey) {
      return 'unavailable';
    }

    if (state.selectedDates.has(dateKey)) {
      return 'selected';
    }

    return getSelectedPetAvailability(pets, schoolClassList, schoolReservationList, state.selectedPetIds, state.selectedClassId, dateKey).status;
  }

  function renderCalendar() {
    const { displayedMonth } = state;
    const year = displayedMonth.getFullYear();
    const month = displayedMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();

    monthLabel.textContent = formatMonth(displayedMonth);
    daysContainer.innerHTML = '';

    for (let index = 0; index < firstWeekday; index += 1) {
      const blankCell = document.createElement('span');
      blankCell.className = 'calendar__empty-cell';
      blankCell.setAttribute('aria-hidden', 'true');
      daysContainer.append(blankCell);
    }

    for (let day = 1; day <= lastDay; day += 1) {
      const date = new Date(year, month, day);
      const dateKey = toDateKey(date);
      const status = getDateStatus(dateKey);
      const isDisabled = status === 'unavailable' || status === 'full';
      const dateButton = document.createElement('button');

      dateButton.className = `calendar__day calendar__day--${status}`;
      dateButton.type = 'button';
      dateButton.dataset.action = 'toggle-reservation-date';
      dateButton.dataset.date = dateKey;
      dateButton.disabled = isDisabled;
      dateButton.setAttribute('role', 'gridcell');
      dateButton.setAttribute('aria-label', `${month + 1}월 ${day}일 (${WEEKDAY_LABELS[date.getDay()]})${status === 'full' ? ', 정원 마감' : ''}`);
      dateButton.innerHTML = `<span class="calendar__day-number">${day}</span>${status === 'full' ? '<span class="calendar__day-note">정원마감</span>' : ''}`;
      daysContainer.append(dateButton);
    }
  }

  function render() {
    const remaining = getRemainingLimit();

    if (state.selectedDates.size > remaining) {
      state.selectedDates = new Set([...state.selectedDates].slice(0, remaining));
    }

    renderPets();
    renderClassSelection();
    renderCalendar();
    renderSummary();
  }

  root.addEventListener('click', (event) => {
    const actionTarget = event.target.closest('[data-action]');

    if (!actionTarget) return;

    if (actionTarget.dataset.action === 'close-reservation-form') {
      onClose?.();
      return;
    }

    if (actionTarget.dataset.action === 'toggle-pet') {
      const { petId } = actionTarget.dataset;

      if (state.selectedPetIds.has(petId)) state.selectedPetIds.delete(petId);
      else state.selectedPetIds.add(petId);

      if (!getSharedClassIds(pets, state.selectedPetIds).includes(state.selectedClassId)) {
        state.selectedClassId = null;
      }

      state.selectedDates.clear();
      render();
    }

    if (actionTarget.dataset.action === 'open-class-selection') {
      classSelectionSheet.hidden = false;
      classSelectionSheet.dataset.state = 'visible';
    }

    if (actionTarget.dataset.action === 'close-class-selection') {
      classSelectionSheet.hidden = true;
      classSelectionSheet.dataset.state = 'hidden';
    }

    if (actionTarget.dataset.action === 'select-class') {
      state.selectedClassId = actionTarget.dataset.classId;
      state.selectedDates.clear();
      classSelectionSheet.hidden = true;
      classSelectionSheet.dataset.state = 'hidden';
      render();
    }

    if (actionTarget.dataset.action === 'previous-reservation-month') {
      state.displayedMonth = new Date(state.displayedMonth.getFullYear(), state.displayedMonth.getMonth() - 1, 1);
      renderCalendar();
    }

    if (actionTarget.dataset.action === 'next-reservation-month') {
      state.displayedMonth = new Date(state.displayedMonth.getFullYear(), state.displayedMonth.getMonth() + 1, 1);
      renderCalendar();
    }

    if (actionTarget.dataset.action === 'toggle-reservation-date') {
      const { date } = actionTarget.dataset;

      if (state.selectedDates.has(date)) state.selectedDates.delete(date);
      else if (state.selectedDates.size < getRemainingLimit()) state.selectedDates.add(date);

      render();
    }

    if (actionTarget.dataset.action === 'submit-reservation') {
      const result = createSchoolReservations({
        memberId: guardian?.id,
        petIds: [...state.selectedPetIds],
        classId: state.selectedClassId,
        dateKeys: [...state.selectedDates],
      });

      if (!result.ok) {
        window.alert(result.message);
        render();
        return;
      }

      const reservationId = result.reservations[0]?.reservationId;

      window.location.assign(`./reservation-history-detail.html?reservationId=${encodeURIComponent(reservationId)}&reservationCompleted=true`);
    }
  });

  render();
}
