import { mockValidations } from './mock_validations.js';

class ValidationFooter {
  constructor() {
    // Calculate total checks from mock data
    this.totalChecks = Object.values(mockValidations)
      .reduce((sum, file) => sum + file.total, 0);
    
    this.currentCheck = 0;
    this.passed = 0;
    this.failed = 0;
    this.errors = new Map();
    this.isExpanded = false;
    this.fileProgress = new Map(
      Object.entries(mockValidations).map(([file, data]) => [
        file, 
        { total: data.total, passed: 0, failed: 0 }
      ])
    );
    
    this.initializeUI();
    this.startValidation();
  }

  initializeUI() {
    // Create footer element
    const footer = document.createElement('div');
    footer.className = 'validation-footer';
    document.body.appendChild(footer);

    // Create collapsed view
    this.createCollapsedView(footer);

    // Create expanded view
    this.createExpandedView(footer);

    // Add expand button
    const expandButton = document.createElement('button');
    expandButton.className = 'expand-button';
    expandButton.innerHTML = `
      <span class="icon">▼</span>
      <span>Details</span>
    `;
    expandButton.onclick = () => this.toggleExpand();
    footer.appendChild(expandButton);
  }

  createCollapsedView(footer) {
    const collapsed = document.createElement('div');
    collapsed.className = 'collapsed-view';

    // Progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    const progressFill = document.createElement('div');
    progressFill.className = 'progress-bar-fill';
    progressBar.appendChild(progressFill);
    collapsed.appendChild(progressBar);

    // Stats
    const stats = document.createElement('div');
    stats.className = 'stats';
    stats.innerHTML = `
      <div class="stat progress">0% complete</div>
      <div class="stat total">0/${this.totalChecks} checks</div>
      <div class="stat passed">✅ 0 passed</div>
      <div class="stat failed">❌ 0 failed</div>
    `;
    collapsed.appendChild(stats);

    footer.appendChild(collapsed);
    this.collapsedView = collapsed;
  }

  createExpandedView(footer) {
    const expanded = document.createElement('div');
    expanded.className = 'validation-details';

    // File groups
    ['collar', 'survey', 'assay', 'lithology'].forEach(file => {
      const group = document.createElement('div');
      group.className = 'file-group';
      group.innerHTML = `
        <div class="file-header">
          <strong>${file.charAt(0).toUpperCase() + file.slice(1)}</strong>
          <span class="stats">
            <span class="passed">✅ 0</span>
            <span class="failed">❌ 0</span>
          </span>
        </div>
        <div class="error-list" style="display: none;"></div>
      `;
      expanded.appendChild(group);
    });

    // Current validation
    const current = document.createElement('div');
    current.className = 'current-checks';
    current.innerHTML = `
      <div class="spinner"></div>
      <strong>Currently validating:</strong>
      <div class="current-check">Initializing...</div>
    `;
    expanded.appendChild(current);

    footer.appendChild(expanded);
    this.expandedView = expanded;
  }

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
    const footer = document.querySelector('.validation-footer');
    footer.classList.toggle('expanded');
  }

  updateProgress() {
    const percent = Math.round((this.currentCheck / this.totalChecks) * 100);
    
    // Update progress bar
    const progressFill = document.querySelector('.progress-bar-fill');
    progressFill.style.width = `${percent}%`;

    // Update stats
    const stats = document.querySelector('.stats');
    stats.innerHTML = `
      <div class="stat progress">${percent}% complete</div>
      <div class="stat total">${this.currentCheck}/${this.totalChecks} checks</div>
      <div class="stat passed">✅ ${this.passed} passed</div>
      <div class="stat failed">❌ ${this.failed} failed</div>
    `;
  }

  addError(file, message) {
    if (!this.errors.has(file)) {
      this.errors.set(file, []);
    }
    this.errors.get(file).push(message);

    // Update error list in UI
    const fileGroup = document.querySelector(`.file-group:nth-child(${['collar', 'survey', 'assay', 'lithology'].indexOf(file) + 1})`);
    const errorList = fileGroup.querySelector('.error-list');
    errorList.style.display = 'block';
    errorList.innerHTML = this.errors.get(file)
      .map(err => `<div class="error-item">❌ ${err}</div>`)
      .join('');
  }

  updateCurrentCheck(check) {
    const current = document.querySelector('.current-check');
    current.innerHTML = check;
  }

  async startValidation() {
    try {
      const steps = 50; // Vamos dividir em 50 passos
      const interval = this.totalChecks / steps;
      
      for (let i = 0; i <= steps; i++) {
        // Atualiza contadores
        this.currentCheck = Math.min(Math.floor(i * interval), this.totalChecks);
        this.passed = Math.floor(this.currentCheck * 0.95); // 95% de sucesso
        this.failed = this.currentCheck - this.passed;
        
        // Atualiza UI
        this.updateProgress();
        this.updateCurrentCheck(`Validating... ${Math.floor((i/steps) * 100)}%`);
        
        // Adiciona alguns erros mock para visualização
        if (i % 10 === 0) {
          const files = ['collar', 'survey', 'assay', 'lithology'];
          const file = files[Math.floor(Math.random() * files.length)];
          this.addError(file, `Mock validation error #${i/10 + 1}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Remove spinner
      const spinner = document.querySelector('.spinner');
      if (spinner) spinner.remove();

      // Show final summary
      const passedPercent = Math.round(this.passed/this.totalChecks*100);
      const failedPercent = Math.round(this.failed/this.totalChecks*100);
      
      const summaryHTML = `
      <div style="margin-top: 8px;">
        <div style="font-size: 16px; color: #2196F3; margin-bottom: 8px;">
          <strong>✅ Validation Complete!</strong>
        </div>
        <div style="display: flex; gap: 24px; margin: 12px 0;">
          <div>
            <strong>Total:</strong> ${this.totalChecks}
          </div>
          <div style="color: #4CAF50">
            <strong>Passed:</strong> ${this.passed} (${passedPercent}%)
          </div>
          <div style="color: #f44336">
            <strong>Failed:</strong> ${this.failed} (${failedPercent}%)
          </div>
        </div>
        <div style="color: #666; font-size: 13px; margin-top: 8px;">
          👉 Click 'Details' to see full validation report
        </div>
      </div>
    `;
    
      this.updateCurrentCheck(summaryHTML);
      
      // Pulse animation on completion
      const footer = document.querySelector('.validation-footer');
      footer.style.animation = 'pulse 2s';
      setTimeout(() => footer.style.animation = '', 2000);
    } catch (error) {
      console.error('Validation error:', error);
      this.updateCurrentCheck(`❌ Error during validation: ${error.message}`);
    }
  }
}

export function initValidationFooter() {
  return new ValidationFooter();
}
