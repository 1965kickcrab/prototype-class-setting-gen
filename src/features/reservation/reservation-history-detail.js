import { cancelSchoolReservations } from '../../services/school-reservation.js';
import { getSchoolReservationData } from '../../storage/school-reservation-storage.js';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function getTodayKey() {
  const today = new Date();

  return [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
}

function formatDate(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return `${month}월 ${day}일 ${WEEKDAY_LABELS[date.getDay()]}요일`;
}

function formatCreatedAt(createdAt) {
  const date = new Date(createdAt);
  const hour = date.getHours();
  const period = hour < 12 ? '오전' : '오후';
  const displayHour = hour % 12 || 12;

  return `예약 등록일 : ${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAY_LABELS[date.getDay()]}) ${period} ${displayHour}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function getPetGroups(reservations) {
  const petGroups = new Map();

  reservations.forEach((reservation) => {
    const petGroupId = String(reservation.petId ?? reservation.petName);
    const petGroup = petGroups.get(petGroupId) ?? { id: petGroupId, reservations: [] };

    petGroup.reservations.push(reservation);
    petGroups.set(petGroupId, petGroup);
  });

  return [...petGroups.values()];
}

export function createReservationHistoryDetail(root) {
  const reservationId = new URLSearchParams(window.location.search).get('reservationId');
  const cancelAllButton = root.querySelector('[data-field="cancel-all"]');
  const cancellationNotice = root.querySelector('[data-field="cancellation-notice"]');
  const status = root.querySelector('[data-field="reservation-status"]');
  const businessName = root.querySelector('[data-field="business-name"]');
  const serviceType = root.querySelector('[data-field="service-type"]');
  const className = root.querySelector('[data-field="class-name"]');
  const createdAt = root.querySelector('[data-field="created-at"]');
  const guardianName = root.querySelector('[data-field="guardian-name"]');
  const reservationCount = root.querySelector('[data-field="reservation-count"]');
  const petGroupsContainer = root.querySelector('[data-field="pet-groups"]');
  const cancelDialog = document.querySelector('[data-field="cancel-dialog"]');
  const expandedPetIds = new Set();

  function getReservations() {
    const { schoolReservationList } = getSchoolReservationData();

    return schoolReservationList.filter((reservation) => (reservation.reservationId ?? reservation.id) === reservationId);
  }

  function render() {
    const reservations = getReservations();
    const activeReservations = reservations.filter((reservation) => reservation.status !== '취소');
    const hasExpiredActiveReservation = activeReservations.some((reservation) => reservation.date <= getTodayKey());
    const canCancelAll = activeReservations.length > 0 && !hasExpiredActiveReservation;
    const isFullyCancelled = reservations.length > 0 && activeReservations.length === 0;

    cancelAllButton.disabled = !canCancelAll;
    cancellationNotice.hidden = !hasExpiredActiveReservation;
    status.textContent = isFullyCancelled ? '예약 취소' : '예약 확정';
    status.dataset.state = isFullyCancelled ? 'cancelled' : 'confirmed';
    businessName.textContent = reservations[0]?.businessName ?? '다이얼독 유치원';
    serviceType.textContent = `${reservations[0]?.serviceType ?? '유치원'} 예약`;
    className.textContent = reservations[0]?.className ?? '클래스 정보 없음';
    createdAt.textContent = reservations[0] ? formatCreatedAt(reservations[0].createdAt) : '';
    guardianName.textContent = reservations[0]?.guardianName ?? '보호자';
    reservationCount.textContent = `${reservations.length}건`;
    petGroupsContainer.innerHTML = getPetGroups(reservations).map((petGroup, petGroupIndex) => {
      const confirmedCount = petGroup.reservations.filter((reservation) => reservation.status !== '취소').length;
      const cancelledCount = petGroup.reservations.length - confirmedCount;
      const pet = petGroup.reservations[0];
      const isExpanded = expandedPetIds.has(petGroup.id);
      const countLabel = [
        confirmedCount > 0 ? `확정 ${confirmedCount}건` : '',
        cancelledCount > 0 ? `취소 ${cancelledCount}건` : '',
      ].filter(Boolean).join(' · ');
      const dateListId = `reservation-pet-dates-${petGroupIndex}`;

      return `
        <article class="reservation-pet-accordion" data-entity-id="${petGroup.id}" data-state="${isExpanded ? 'expanded' : 'folded'}">
          <button class="reservation-pet-accordion__toggle" type="button" data-action="toggle-pet" aria-expanded="${isExpanded}" aria-controls="${dateListId}">
            <span class="reservation-pet-accordion__profile">
              <img class="reservation-pet-accordion__avatar" src="assets/images/defaultProfile_dog.svg" alt="" />
              <span class="reservation-pet-accordion__content">
                <strong class="reservation-pet-accordion__name">${pet.petName}</strong>
                <span class="reservation-pet-accordion__meta">
                  <span>${pet.breed || '품종 미입력'}</span>
                  <span class="reservation-pet-accordion__weight">${pet.weight || '-kg'}</span>
                </span>
              </span>
            </span>
            <span class="reservation-pet-accordion__summary">
              <span class="reservation-pet-accordion__count">${countLabel}</span>
              <span class="reservation-pet-accordion__fold${isExpanded ? ' reservation-pet-accordion__fold--expanded' : ''}" aria-hidden="true"></span>
            </span>
          </button>
          <ul class="reservation-pet-accordion__date-list" id="${dateListId}" ${isExpanded ? '' : 'hidden'}>
            ${petGroup.reservations.map((reservation) => `
              <li class="reservation-date-status">
                <span>${formatDate(reservation.date)}</span>
                <span class="reservation-date-status__state reservation-date-status__state--${reservation.status === '취소' ? 'canceled' : 'confirmed'}">${reservation.status === '취소' ? '취소' : '확정'}</span>
              </li>
            `).join('')}
          </ul>
        </article>
      `;
    }).join('');
  }

  root.addEventListener('click', (event) => {
    const actionTarget = event.target.closest('[data-action]');

    if (!actionTarget) return;

    if (actionTarget.dataset.action === 'go-back') window.location.assign('./reservation-history.html');

    if (actionTarget.dataset.action === 'toggle-pet') {
      const petAccordion = actionTarget.closest('[data-entity-id]');
      const { entityId } = petAccordion.dataset;

      if (expandedPetIds.has(entityId)) expandedPetIds.delete(entityId);
      else expandedPetIds.add(entityId);

      render();
      [...petGroupsContainer.querySelectorAll('[data-action="toggle-pet"]')]
        .find((toggle) => toggle.closest('[data-entity-id]')?.dataset.entityId === entityId)
        ?.focus();
    }

    if (actionTarget.dataset.action === 'cancel-all' && !cancelAllButton.disabled && !cancelDialog.open) {
      cancelDialog.showModal();
    }

  });

  cancelDialog.addEventListener('click', (event) => {
    const actionTarget = event.target.closest('[data-action]');

    if (!actionTarget) return;

    if (actionTarget.dataset.action === 'close-cancel-dialog') cancelDialog.close();

    if (actionTarget.dataset.action === 'confirm-cancel-all') {
      const activeReservationIds = getReservations()
        .filter((reservation) => reservation.status !== '취소')
        .map((reservation) => reservation.id);
      const result = cancelSchoolReservations(activeReservationIds);

      if (!result.ok) window.alert(result.message);
      cancelDialog.close();
      render();
    }
  });

  render();
}
