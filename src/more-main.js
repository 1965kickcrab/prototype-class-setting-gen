import { attachBottomNavigation, renderBottomNavigation } from './components/bottom-navigation.js';
import { createMoreHome } from './features/more/more-home.js';

const bottomNavigationContainer = document.querySelector('[data-component="bottom-navigation"]');

bottomNavigationContainer.innerHTML = renderBottomNavigation('more');
attachBottomNavigation(bottomNavigationContainer);
createMoreHome(document.querySelector('.more-home'));
