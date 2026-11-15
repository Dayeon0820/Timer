// MediaPipe 얼굴 변환 행렬(4x4)에서 고개 각도(도 단위)를 계산하는 유틸

const RAD2DEG = 180 / Math.PI;

/**
 * facialTransformationMatrixes[0].data(16개 값, 열 우선 column-major)를 받아
 * yaw(좌우), pitch(상하), roll(기울기)을 도 단위로 반환한다.
 *
 * 회전 행렬 R = Ry(yaw) · Rx(pitch) · Rz(roll) 로 분해한다고 가정하면
 *   R[0][2] =  sin(yaw)·cos(pitch)
 *   R[1][2] = -sin(pitch)
 *   R[2][2] =  cos(yaw)·cos(pitch)
 *   R[1][0] =  cos(pitch)·sin(roll),  R[1][1] = cos(pitch)·cos(roll)
 * MediaPipe 좌표계는 Y축이 위쪽이므로, pitch 가 양수면 고개를 숙인 방향이다.
 */
export function matrixToEuler(data) {
  // 열 우선 배열에서 R[row][col] = data[col * 4 + row]
  const r = (row, col) => data[col * 4 + row];

  // asin 입력값이 부동소수점 오차로 [-1, 1]을 벗어나지 않도록 보정
  const s = Math.max(-1, Math.min(1, -r(1, 2)));
  const pitch = Math.asin(s) * RAD2DEG;
  const yaw = Math.atan2(r(0, 2), r(2, 2)) * RAD2DEG;
  const roll = Math.atan2(r(1, 0), r(1, 1)) * RAD2DEG;

  return { yaw, pitch, roll };
}

/** 블렌드셰이프 배열에서 특정 이름의 점수를 찾는다 (없으면 0) */
export function getBlendshape(categories, name) {
  const found = categories?.find((c) => c.categoryName === name);
  return found ? found.score : 0;
}
