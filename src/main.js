import { attachBottomNavigation, renderBottomNavigation } from './components/bottom-navigation.js';
import { createReservationHome } from './features/reservation/reservation-home.js';

const bottomNavigationContainer = document.querySelector('[data-component="bottom-navigation"]');
const reservationHome = document.querySelector('.reservation-home');

bottomNavigationContainer.innerHTML = renderBottomNavigation('reservation');
attachBottomNavigation(bottomNavigationContainer);
createReservationHome(reservationHome);
