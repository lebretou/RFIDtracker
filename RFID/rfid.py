import time
from collections import deque
import numpy as np
from scipy.stats import norm


class RFIDTag:
    def __init__(self, epc: str, tag_id: int, num_tags: int):
        self.epc = epc
        self.id = tag_id
        self.last_read_time = time.time()
        self.rssi = 0
        self.frequency = 0
        self.read_count = 0
        self.total_read_time = 0.0
        self.avg_read_time = 0.0
        self.read_times = deque(maxlen=100)  # Keep last 100 read times
        self.var_read_time = 0
        self.visibility_prob = 0.5  # Initial probability of being visible

        # Bayesian filter parameters
        self.visible_mean = 0.0956
        self.visible_var = 0.0051
        self.covered_mean = 0.62
        self.covered_var = 7.38
        self.transition_rate = 0.1  # Probability of transitioning between states

        # Event detection parameters
        self.prob_history = deque(maxlen=50)  # Keep last 50 probability values
        self.time_history = deque(maxlen=50)  # Keep corresponding timestamps

    def update_visibility(self, current_time, num_samples=10):
        elapsed_time = current_time - self.last_read_time
        self.read_times.append(elapsed_time)

        visibility_samples = []
        for _ in range(num_samples):
            # Sample an elapsed time from recent history
            sampled_time = np.random.choice(self.read_times)

            # Transition model
            v_prob = 0.5 + (self.visibility_prob - 0.5) * (1 - self.transition_rate)

            # Observation model
            p_visible = norm.pdf(sampled_time, self.visible_mean, np.sqrt(self.visible_var))
            p_covered = norm.pdf(sampled_time, self.covered_mean, np.sqrt(self.covered_var))

            # Bayes update
            likelihood_visible = p_visible * v_prob
            likelihood_covered = p_covered * (1 - v_prob)
            total_likelihood = likelihood_visible + likelihood_covered

            if total_likelihood > 0:
                v_prob = likelihood_visible / total_likelihood

            visibility_samples.append(v_prob)

        # Update visibility probability with the mean of samples
        self.visibility_prob = np.mean(visibility_samples)

        # Decay the probability towards 0.5 for long periods without reads
        decay_factor = np.exp(-elapsed_time / 10)  # Adjust the 10 to control decay rate
        self.visibility_prob = 0.5 + (self.visibility_prob - 0.5) * decay_factor

        # Update probability history
        self.prob_history.append(self.visibility_prob)
        self.time_history.append(current_time)
