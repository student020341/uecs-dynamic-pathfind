// basic queries for ecs

export const query = (world, ...components) => {
  const arr = [];
  world.view(...components).each((...data) => {
    arr.push(data);
  });
  return arr;
};

export const filter = (world, fn, ...components) => {
  const arr = [];
  world.view(...components).each((...data) => {
    if (fn(...data)) {
      arr.push(data);
    }
  });
  return arr;
};
