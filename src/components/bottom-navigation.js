export function renderBottomNavigation(activeItem = 'reservation') {
  const reservationState = activeItem === 'reservation' ? ' bottom-navigation__item--active' : '';
  const reportState = activeItem === 'report' ? ' bottom-navigation__item--active' : '';
  const moreState = activeItem === 'more' ? ' bottom-navigation__item--active' : '';
  const reservationCurrent = activeItem === 'reservation' ? ' aria-current="page"' : '';
  const reportCurrent = activeItem === 'report' ? ' aria-current="page"' : '';
  const moreCurrent = activeItem === 'more' ? ' aria-current="page"' : '';

  return `
    <nav class="bottom-navigation" aria-label="주요 메뉴">
      <button class="bottom-navigation__item${reservationState}" type="button" data-action="navigate" data-destination="reservation"${reservationCurrent}>
        <span class="bottom-navigation__label">예약</span>
      </button>
      <button class="bottom-navigation__item${reportState}" type="button" data-action="navigate" data-destination="report"${reportCurrent}>
        <span class="bottom-navigation__label">알림장</span>
      </button>
      <button class="bottom-navigation__item${moreState}" type="button" data-action="navigate" data-destination="more"${moreCurrent}>
        <span class="bottom-navigation__label">더보기</span>
      </button>
    </nav>
  `;
}

export function attachBottomNavigation(container) {
  container.addEventListener('click', (event) => {
    const navigationItem = event.target.closest('[data-action="navigate"]');

    if (!navigationItem) return;

    if (navigationItem.dataset.destination === 'reservation') window.location.assign('./index.html');
    if (navigationItem.dataset.destination === 'report') window.location.assign('./report.html');
    if (navigationItem.dataset.destination === 'more') window.location.assign('./more.html');
  });
}
