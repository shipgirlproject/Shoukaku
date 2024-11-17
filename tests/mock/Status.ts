const status = <T extends number>(status: T) => ({ status });

export const ok = status(200);
export const noContent = status(204);
