import torch
import torch.nn as nn

def gradient_descent_exercise(x0_target, W_target, dt, Tau, total_time, epochs):
    """
    params:
    x0_target: target initial condition
    W_target: target weight
    dt: time step
    Tau: speed of decay
    total_time: total time
    """
    # simulate x to get x_target
    steps = int(total_time / dt)
    x_target = [x0_target]
    for t in range(steps):
        x_next = x_target[-1] - (dt/Tau) * W_target * x_target[-1]
        x_target.append(x_next)
    x_target = torch.tensor(x_target)

    # pretend we don't know x0_target and W_target
    random_val = torch.randn(1).item()
    x0_param = torch.nn.Parameter(torch.tensor(random_val))  
    W_param  = torch.nn.Parameter(torch.tensor(random_val)) 

    optimizer = torch.optim.Adam([x0_param, W_param], lr=0.05)

    # recover x0_target and W_target using gradient descent
    for epoch in range(epochs):
        # simulate x_target with current estimated parameters
        x_pred = [x0_param]
        for t in range(steps):
            x_next = x_pred[-1] - (dt/Tau) * W_param * x_pred[-1]
            x_pred.append(x_next)
        x_pred = torch.stack(x_pred)

        # loss
        loss = torch.sum((x_pred - x_target)**2)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        if epoch % 200 == 0:
            print(f"Epoch {epoch}: Loss: {loss.item():.6f} x0: {x0_param.item():.4f}, W: {W_param.item():.4f}")

    print("\nRecovered parameters:")
    print("x0:", x0_param.item(), "vs target", x0_target)
    print("W :", W_param.item(), "vs target", W_target)

gradient_descent_exercise(1, 2, 0.1, 10, 10, 1000)
gradient_descent_exercise(10, 20, 0.1, 10, 10, 1000)
gradient_descent_exercise(20, 10, 0.1, 10, 10, 1000)
gradient_descent_exercise(20, 10, 0.1, 10, 10, 2000)