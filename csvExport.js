/**
 * CSV Export Module for ProfitPerPlate
 * Handles exporting summary data to CSV format
 */

class CSVExporter {
  constructor() {
    this.currencySymbol = '₱'; // Default currency
    this.recipeName = '';
    this.servingScale = 1;
    
    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
      this.initialize();
    });
  }
  
  /**
   * Initialize CSV export functionality
   */
  initialize() {
    const exportBtn = document.getElementById('exportCsvBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportToCSV());
    }
    
    // Watch for currency changes
    const currencySelect = document.getElementById('currencySelect');
    if (currencySelect) {
      this.currencySymbol = currencySelect.value;
      currencySelect.addEventListener('change', (e) => {
        this.currencySymbol = e.target.value;
      });
    }
    
    // Watch for serving scale changes
    const servingScale = document.getElementById('servingScale');
    if (servingScale) {
      this.servingScale = parseFloat(servingScale.value) || 1;
      servingScale.addEventListener('input', (e) => {
        this.servingScale = parseFloat(e.target.value) || 1;
      });
    }
  }
  
  /**
   * Get current recipe name
   */
  getCurrentRecipeName() {
    const nameDisplay = document.getElementById('currentRecipeNameDisplay');
    return nameDisplay ? nameDisplay.textContent : 'Recipe_Analysis';
  }
  
  /**
   * Format currency value
   */
  formatCurrency(value) {
    return `${this.currencySymbol}${parseFloat(value).toFixed(2)}`;
  }
  
  /**
   * Get raw materials data from summary table
   */
  getRawMaterialsData() {
    const data = [];
    const rows = document.querySelectorAll('#rawMaterialsPreviewBody tr');
    
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 5) {
        data.push({
          material: cells[0].textContent.trim(),
          qty: cells[2].textContent.trim(),
          unitCost: cells[3].textContent.trim(),
          totalCost: cells[4].textContent.trim()
        });
      }
    });
    
    return data;
  }
  
  /**
   * Get direct labor data from summary table
   */
  getDirectLaborData() {
    const data = [];
    const rows = document.querySelectorAll('#directLaborPreviewBody tr');
    
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 4) {
        data.push({
          laborItem: cells[0].textContent.trim(),
          timeRequired: cells[1].textContent.trim(),
          rate: cells[2].textContent.trim(),
          totalCost: cells[3].textContent.trim()
        });
      }
    });
    
    return data;
  }
  
  /**
   * Get summary calculations
   */
  getSummaryData() {
    const summaryItems = document.querySelectorAll('.summary-item');
    const data = {};
    
    summaryItems.forEach(item => {
      const label = item.querySelector('label');
      const value = item.querySelector('span');
      if (label && value) {
        const labelText = label.textContent.replace(':', '').trim();
        data[labelText] = value.textContent.trim();
      }
    });
    
    return data;
  }
  
  /**
   * Get summary controls data
   */
  getControlsData() {
    return {
      servingScale: document.getElementById('servingScale')?.value || '1',
      markup: document.getElementById('markup')?.value || '40',
      tax: document.getElementById('tax')?.value || '0',
      vat: document.getElementById('vat')?.value || '0'
    };
  }
  
  /**
   * Convert data to CSV string
   */
  convertToCSV(data) {
    const csvRows = [];
    
    // Add headers
    if (data.headers) {
      csvRows.push(data.headers.join(','));
    }
    
    // Add rows
    data.rows.forEach(row => {
      const escapedRow = row.map(field => {
        // Escape quotes and wrap in quotes if contains comma
        const stringField = String(field).replace(/"/g, '""');
        return stringField.includes(',') ? `"${stringField}"` : stringField;
      });
      csvRows.push(escapedRow.join(','));
    });
    
    return csvRows.join('\n');
  }
  
  /**
   * Generate CSV data structure
   */
  generateCSVData() {
    const recipeName = this.getCurrentRecipeName();
    const rawMaterials = this.getRawMaterialsData();
    const directLabor = this.getDirectLaborData();
    const summary = this.getSummaryData();
    const controls = this.getControlsData();
    
    const csvSections = [];
    
    // 1. Recipe Information
    csvSections.push({
      title: 'RECIPE ANALYSIS',
      data: [
        ['Recipe Name', recipeName],
        ['Analysis Date', new Date().toLocaleDateString()],
        ['Currency', this.currencySymbol],
        ['Serving Scale', `${controls.servingScale}x`],
        ['Markup', `${controls.markup}%`],
        ['Regular Tax', `${controls.tax}%`],
        ['VAT', `${controls.vat}%`],
        ['', ''],
        ['', '']
      ]
    });
    
    // 2. Raw Materials
    if (rawMaterials.length > 0) {
      csvSections.push({
        title: 'RAW MATERIALS BREAKDOWN',
        headers: ['Raw Material', 'Quantity', 'Unit Cost', 'Total Cost'],
        rows: rawMaterials.map(item => [item.material, item.qty, item.unitCost, item.totalCost])
      });
    }
    
    // 3. Direct Labor
    if (directLabor.length > 0) {
      csvSections.push({
        title: 'DIRECT LABOR BREAKDOWN',
        headers: ['Labor Item', 'Time Required', 'Rate', 'Total Cost'],
        rows: directLabor.map(item => [item.laborItem, item.timeRequired, item.rate, item.totalCost])
      });
    }
    
    // 4. Summary Calculations
    const summaryRows = [];
    Object.entries(summary).forEach(([key, value]) => {
      summaryRows.push([key, value]);
    });
    
    if (summaryRows.length > 0) {
      csvSections.push({
        title: 'SUMMARY CALCULATIONS',
        headers: ['Metric', 'Value'],
        rows: summaryRows
      });
    }
    
    // Combine all sections
    const finalCSV = [];
    csvSections.forEach((section, index) => {
      // Add section title
      finalCSV.push([section.title]);
      finalCSV.push([]);
      
      // Add headers if they exist
      if (section.headers) {
        finalCSV.push(section.headers);
      }
      
      // Add data rows
      if (section.data) {
        section.data.forEach(row => finalCSV.push(row));
      }
      if (section.rows) {
        section.rows.forEach(row => finalCSV.push(row));
      }
      
      // Add separator between sections (unless last section)
      if (index < csvSections.length - 1) {
        finalCSV.push([]);
        finalCSV.push([]);
      }
    });
    
    return {
      headers: [], // No global headers since we have sections
      rows: finalCSV
    };
  }
  
  /**
   * Trigger CSV download
   */
  downloadCSV(csvContent, fileName) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (navigator.msSaveBlob) { // IE 10+
      navigator.msSaveBlob(blob, fileName);
    } else {
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
  
  /**
   * Export data to CSV file
   */
  exportToCSV() {
    try {
      // Check if a recipe is loaded
      const recipeNameElement = document.getElementById('currentRecipeNameDisplay');
      if (!recipeNameElement || recipeNameElement.textContent.includes('Select a recipe')) {
        this.showNotification('Please load a recipe first before exporting.', 'warning');
        return;
      }
      
      // Generate CSV data
      const csvData = this.generateCSVData();
      const csvString = this.convertToCSV(csvData);
      
      // Create filename
      const recipeName = this.getCurrentRecipeName().replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const date = new Date().toISOString().split('T')[0];
      const fileName = `profitperplate_${recipeName}_${date}.csv`;
      
      // Download
      this.downloadCSV(csvString, fileName);
      
      // Show success notification
      this.showNotification('CSV exported successfully!', 'success');
      
    } catch (error) {
      console.error('Error exporting CSV:', error);
      this.showNotification('Failed to export CSV. Please try again.', 'error');
    }
  }
  
  /**
   * Show notification to user
   */
  showNotification(message, type = 'info') {
    // Check if global notification system exists
    if (typeof showGlobalNotification === 'function') {
      showGlobalNotification(message, type);
      return;
    }
    
    // Fallback notification
    const notification = document.createElement('div');
    notification.className = `global-notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-message">${message}</div>
        <button class="notification-close">×</button>
      </div>
    `;
    
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '10000';
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
    
    // Close button functionality
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.remove();
    });
  }
}

// Initialize CSV exporter
const csvExporter = new CSVExporter();

// Export for use in other files if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CSVExporter, csvExporter };
}