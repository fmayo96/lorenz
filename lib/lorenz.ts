// Campo vectorial e integrador del sistema de Lorenz (1963).
//
//   xdot = sigma (y - x)
//   ydot = x (rho - z) - y
//   zdot = x y - beta z
//
// Misma estructura que f_l63 / rk4_paso en codigo/modelos.py: RK4 clásico de
// paso fijo, sin usar ningún integrador de librería.

export type State = [number, number, number];

export interface LorenzParams {
  sigma: number;
  rho: number;
  beta: number;
}

export function fL63([x, y, z]: State, { sigma, rho, beta }: LorenzParams): State {
  return [sigma * (y - x), x * (rho - z) - y, x * y - beta * z];
}

function add(a: State, b: State, scale: number): State {
  return [a[0] + scale * b[0], a[1] + scale * b[1], a[2] + scale * b[2]];
}

export function rk4Step(s: State, dt: number, params: LorenzParams): State {
  const k1 = fL63(s, params);
  const k2 = fL63(add(s, k1, dt / 2), params);
  const k3 = fL63(add(s, k2, dt / 2), params);
  const k4 = fL63(add(s, k3, dt), params);

  return [
    s[0] + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
    s[1] + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
    s[2] + (dt / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]),
  ];
}

export const CANONICAL_PARAMS: LorenzParams = { sigma: 10, rho: 28, beta: 8 / 3 };

export const FIXED_DT = 0.005;

export const BASE_INITIAL_STATE: State = [1, 1, 1];

/** Tres condiciones iniciales casi idénticas, separadas por `delta` en x. */
export function perturbedInitialStates(delta: number): [State, State, State] {
  const [x, y, z] = BASE_INITIAL_STATE;
  return [
    [x - delta, y, z],
    [x, y, z],
    [x + delta, y, z],
  ];
}
