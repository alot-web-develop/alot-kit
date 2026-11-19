type T__Name__Deps = { now: () => Date };
type T__Name__Input = { name: string };
type T__Name__Result = { name: string; processedAt: string };

const create__Name__Service = ({ now }: T__Name__Deps) => {
  const run = async (input: T__Name__Input): Promise<T__Name__Result> => ({
    name: input.name.trim(),
    processedAt: now().toISOString(),
  });

  return { run };
};

type T__Name__Service = ReturnType<typeof create__Name__Service>;

export { create__Name__Service };
export type { T__Name__Deps, T__Name__Input, T__Name__Result, T__Name__Service };
