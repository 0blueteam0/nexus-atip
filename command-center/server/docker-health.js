const { execSync } = require('child_process');

class DockerHealth {
  constructor(options = {}) {
    this.interval = options.interval || 60000; // 60 seconds default
    this.onChange = null;
    this.intervalId = null;
    this.lastHealth = null;
  }

  /**
   * Check if Docker daemon is running
   * @returns {boolean}
   */
  isDockerRunning() {
    try {
      execSync('docker info', { stdio: 'pipe' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get status of all containers
   * @returns {Array} Array of container objects
   */
  getContainerStatus() {
    try {
      const output = execSync('docker ps -a --format "{{json .}}"', {
        stdio: 'pipe',
        encoding: 'utf8'
      });

      if (!output.trim()) {
        return [];
      }

      return output
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line);
          } catch (e) {
            return null;
          }
        })
        .filter(item => item !== null)
        .map(container => ({
          id: container.ID,
          name: container.Names,
          image: container.Image,
          status: container.Status,
          state: container.State,
          ports: container.Ports || 'N/A'
        }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Get overall Docker health status
   * @returns {Object} Health status object
   */
  getHealth() {
    const dockerRunning = this.isDockerRunning();
    const containers = dockerRunning ? this.getContainerStatus() : [];
    const checkedAt = new Date().toISOString();

    // Count container states
    const runningCount = containers.filter(c => c.state === 'running').length;
    const stoppedCount = containers.filter(c => c.state === 'exited').length;

    const health = {
      docker_running: dockerRunning,
      containers_total: containers.length,
      containers_running: runningCount,
      containers_stopped: stoppedCount,
      containers: containers,
      checked_at: checkedAt,
      summary: dockerRunning
        ? `Docker is running with ${containers.length} containers (${runningCount} running, ${stoppedCount} stopped)`
        : 'Docker daemon is not running'
    };

    this.lastHealth = health;
    return health;
  }

  /**
   * Start periodic health checks
   * @param {Function} onChange - Callback function when health changes
   */
  start(onChange) {
    if (this.intervalId) {
      return; // Already running
    }

    this.onChange = onChange;

    // Initial check
    const initialHealth = this.getHealth();
    if (this.onChange) {
      this.onChange(initialHealth);
    }

    // Set up periodic checks
    this.intervalId = setInterval(() => {
      const currentHealth = this.getHealth();

      // Notify on change
      if (this.onChange) {
        // Check if docker status changed
        if (
          currentHealth.docker_running !== this.lastHealth.docker_running ||
          currentHealth.containers_total !== this.lastHealth.containers_total ||
          currentHealth.containers_running !== this.lastHealth.containers_running
        ) {
          this.onChange(currentHealth);
        }
      }
    }, this.interval);
  }

  /**
   * Stop periodic health checks
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

module.exports = DockerHealth;
