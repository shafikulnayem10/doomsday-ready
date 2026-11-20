// Graph: movieId -> list of its direct prerequisite movie ids
export type PrerequisiteGraph = Map<number, number[]>;

/**
 * Rewatch order using DFS post-order (this gives a valid topological order).
 * A movie is added to the result only AFTER all its prerequisites are added.
 */
export function computeRewatchOrder(
  graph: PrerequisiteGraph,
  targetId: number,
): number[] {
  const visited = new Set<number>();
  const order: number[] = [];

  function visit(movieId: number): void {
    if (visited.has(movieId)) return; // each movie is processed exactly once
    visited.add(movieId);

    for (const prerequisiteId of graph.get(movieId) ?? []) {
      visit(prerequisiteId); // go deeper first
    }

    order.push(movieId); // add myself movie  after all my prerequisites movies are added
  }

  visit(targetId);
  order.pop(); // the target is always pushed last, so remove it
  return order;
}

/**
 * Cycle detection using DFS with a "currently visiting" marker.
 * If DFS reaches a movie that is still on the current path, there is a cycle.
 */
export function hasCycle(graph: PrerequisiteGraph, startId: number): boolean {
  const VISITING = 1;
  const DONE = 2;
  const state = new Map<number, number>();

  function dfs(movieId: number): boolean {
    state.set(movieId, VISITING);

    for (const prerequisiteId of graph.get(movieId) ?? []) {
      const prerequisiteState = state.get(prerequisiteId);
      if (prerequisiteState === VISITING) return true; // back to the current path
      if (prerequisiteState === undefined && dfs(prerequisiteId)) return true;
    }

    state.set(movieId, DONE);
    return false;
  }

  return dfs(startId);
}