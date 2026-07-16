import { getStoredMembers } from '../../storage/member-storage.js';

const PROFILE_IMAGE_BY_PET_ID = {
  'pet-bori': 'assets/images/bori-report-thumbnail.jpg',
};

function getPetImage(pet) {
  return PROFILE_IMAGE_BY_PET_ID[pet.id] ?? 'assets/images/defaultProfile_dog.svg';
}

export function createPetHome(root) {
  const petList = root.querySelector('[data-field="pet-list"]');
  const emptyMessage = root.querySelector('[data-field="empty-message"]');
  const [guardian] = getStoredMembers();
  const pets = guardian?.pets ?? [];

  emptyMessage.hidden = pets.length > 0;
  petList.innerHTML = pets.map((pet) => `
    <article class="pet-list-item" data-entity-id="${pet.id}">
      <img class="pet-list-item__image" src="${getPetImage(pet)}" alt="" />
      <div class="pet-list-item__content">
        <strong class="pet-list-item__name">${pet.petName}</strong>
        <span class="pet-list-item__breed">${pet.breed}</span>
      </div>
      <span class="pet-list-item__chevron" aria-hidden="true">›</span>
    </article>
  `).join('');

  root.addEventListener('click', (event) => {
    const actionTarget = event.target.closest('[data-action]');

    if (actionTarget?.dataset.action === 'go-back') {
      window.location.assign('./more.html');
    }
  });
}
