import numpy as np
import matplotlib.pyplot as plt

def plot_euler(tau, dt, total_time, x0):
    """
    params:
    tau: speed of decay
    dt: time step
    total_time: total time
    x0: initial condition
    """
    steps = int(total_time / dt)
    x = np.zeros(steps)
    x[0] = x0
    time = np.arange(steps) * dt

    for t in range(steps - 1):
        x[t+1] = x[t] - (dt/tau) * x[t]


    plt.plot(time, x)
    plt.xlabel("time (t)")
    plt.ylabel("x(t)")
    plt.title("Exponential decay: τ dx/dt = -x")
    plt.show()

plot_euler(10, 0.1, 100, 1.0)