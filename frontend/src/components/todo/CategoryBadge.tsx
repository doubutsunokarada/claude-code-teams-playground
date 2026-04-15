interface CategoryBadgeProps {
  name: string;
  color: string;
}

export function CategoryBadge({ name, color }: CategoryBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      {name}
    </span>
  );
}
