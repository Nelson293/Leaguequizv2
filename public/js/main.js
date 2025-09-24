// State management
class StateManager {
  constructor() {
    this.state = {
      currentPage: 'index',
      selectedRole: null,
      quizProgress: {
        score: 0,
        questionsAnswered: 0,
        answers: []
      }
    };
    this.init();
  }

  async init() {
    // Load saved state on page load
    await this.loadState();
    this.navigateToSavedPage();
  }

  async loadState() {
    try {
      const response = await fetch('/api/state');
      const data = await response.json();
      this.state = data;
    } catch (error) {
      console.error('Failed to load state:', error);
    }
  }

  async saveState(updates = {}) {
    try {
      const newState = { ...this.state, ...updates };
      
      await fetch('/api/state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newState)
      });
      
      this.state = newState;
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }

  navigateToSavedPage() {
    const currentPath = window.location.pathname;
    const savedPage = this.state.currentPage;

    // Map saved page states to URLs
    const pageMap = {
      'index': '/',
      'role-select': '/role-select.html',
      'quiz': '/quiz.html'
    };

    // If we're not on the saved page, redirect
    if (savedPage && pageMap[savedPage] && currentPath !== pageMap[savedPage]) {
      window.location.href = pageMap[savedPage];
    }
  }

  async selectRole(role) {
    await this.saveState({
      selectedRole: role,
      currentPage: 'quiz'
    });
    window.location.href = `/quiz.html?role=${role}`;
  }

  async acceptQueue() {
    await this.saveState({
      currentPage: 'role-select'
    });
    window.location.href = '/role-select.html';
  }

  async resetProgress() {
    try {
      await fetch('/api/reset', { method: 'POST' });
      this.state = {
        currentPage: 'index',
        selectedRole: null,
        quizProgress: {
          score: 0,
          questionsAnswered: 0,
          answers: []
        }
      };
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to reset progress:', error);
    }
  }
}

// Initialize state manager
const stateManager = new StateManager();

// Update your existing functions to use state management
function selectRole(role) {
  stateManager.selectRole(role);
}

// For the accept button
document.addEventListener('DOMContentLoaded', () => {
  const acceptButton = document.querySelector('.accept-button');
  if (acceptButton) {
    acceptButton.addEventListener('click', () => {
      stateManager.acceptQueue();
    });
  }
});
