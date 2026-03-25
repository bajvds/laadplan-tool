export function getOrientations(unit) {
  const variants = [
    { placedLength: unit.length, placedWidth: unit.width, rotated: false },
    { placedLength: unit.width, placedWidth: unit.length, rotated: true },
  ];

  return variants.filter(
    (variant, index, arr) =>
      index ===
      arr.findIndex(
        (candidate) =>
          candidate.placedLength === variant.placedLength && candidate.placedWidth === variant.placedWidth,
      ),
  );
}

export function overlaps(a, b) {
  return (
    a.x < b.x + b.placedLength &&
    a.x + a.placedLength > b.x &&
    a.y < b.y + b.placedWidth &&
    a.y + a.placedWidth > b.y
  );
}

export function getCandidatePositions(placed, orientation, vehicle) {
  const xPositions = new Set([0]);
  const yPositions = new Set([0]);

  placed.forEach((item) => {
    xPositions.add(item.x);
    xPositions.add(item.x + item.placedLength);
    xPositions.add(item.x - orientation.placedLength);
    yPositions.add(item.y);
    yPositions.add(item.y + item.placedWidth);
    yPositions.add(item.y - orientation.placedWidth);
  });

  return [...xPositions]
    .filter((x) => x >= 0 && x + orientation.placedLength <= vehicle.length)
    .sort((a, b) => a - b)
    .flatMap((x) =>
      [...yPositions]
        .filter((y) => y >= 0 && y + orientation.placedWidth <= vehicle.width)
        .sort((a, b) => a - b)
        .map((y) => ({ x, y })),
    );
}
