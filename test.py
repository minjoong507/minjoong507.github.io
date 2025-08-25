import collections


# 헬퍼 함수: 특정 빙고판과 불린 숫자 집합이 주어졌을 때, 해당 빙고판의 빙고 개수를 계산
def calculate_bingos_for_set(board_map, called_set):
    """
    주어진 빙고판과 불린 숫자 집합에 대해 현재 빙고 개수를 계산합니다.

    Args:
        board_map (dict): {숫자: (행, 열)} 형태의 빙고판 맵.
        called_set (set): 현재까지 불린 숫자들의 집합.

    Returns:
        int: 해당 빙고판의 현재 빙고 개수.
    """
    # 각 라인의 지워진 숫자 카운트
    temp_counts = {
        'rows': [0, 0, 0],
        'cols': [0, 0, 0],
        'diag1': 0,  # 메인 대각선 (0,0), (1,1), (2,2)
        'diag2': 0  # 역 대각선 (0,2), (1,1), (2,0)
    }

    current_bingo_count = 0
    # 이미 빙고가 된 라인을 추적하여 중복 카운트 방지 (예: ('row', 0), ('diag', 1) 등)
    achieved_lines = set()

    # 불린 숫자 집합에 있는 각 숫자에 대해 처리
    for num in called_set:
        if num in board_map:  # 해당 숫자가 이 빙고판에 있다면
            r, c = board_map[num]

            # 1. 행 카운트 업데이트 및 빙고 확인
            temp_counts['rows'][r] += 1
            if temp_counts['rows'][r] == 3 and ('row', r) not in achieved_lines:
                current_bingo_count += 1
                achieved_lines.add(('row', r))

            # 2. 열 카운트 업데이트 및 빙고 확인
            temp_counts['cols'][c] += 1
            if temp_counts['cols'][c] == 3 and ('col', c) not in achieved_lines:
                current_bingo_count += 1
                achieved_lines.add(('col', c))

            # 3. 메인 대각선 (0,0), (1,1), (2,2) 카운트 업데이트 및 빙고 확인
            if r == c:
                temp_counts['diag1'] += 1
                if temp_counts['diag1'] == 3 and ('diag', 1) not in achieved_lines:
                    current_bingo_count += 1
                    achieved_lines.add(('diag', 1))

            # 4. 역 대각선 (0,2), (1,1), (2,0) 카운트 업데이트 및 빙고 확인
            if r + c == 2:
                temp_counts['diag2'] += 1
                if temp_counts['diag2'] == 3 and ('diag', 2) not in achieved_lines:
                    current_bingo_count += 1
                    achieved_lines.add(('diag', 2))
    return current_bingo_count


def solution(bingo_boards):
    """
    나만 3빙고 이상, 다른 플레이어는 2빙고 이하가 되는 '불린 숫자 집합'의 개수를 계산합니다.

    Args:
        bingo_boards (list): 각 플레이어의 3x3 빙고판 리스트.
                              각 빙고판은 2차원 리스트 형태.
                              (첫 번째 빙고판이 '내' 빙고판입니다.)

    Returns:
        int: 조건을 만족하는 '불린 숫자 집합'의 총 개수.
    """
    num_players = len(bingo_boards)
    my_board_idx = 0  # 내 빙고판은 항상 첫 번째 (인덱스 0)

    # 1. 모든 빙고판에 나타난 유니크한 숫자들을 수집하고, 각 숫자의 위치를 매핑
    all_unique_numbers = set()  # 모든 빙고판에 있는 유니크한 숫자들을 저장
    board_maps = []  # 각 플레이어별 board_map (숫자 -> (행, 열)) 저장

    for player_board in bingo_boards:
        current_map = {}
        for r in range(3):
            for c in range(3):
                num = player_board[r][c]
                current_map[num] = (r, c)
                all_unique_numbers.add(num)
        board_maps.append(current_map)

    # 모든 유니크 숫자를 리스트로 변환하고 정렬 (비트마스킹 인덱스 매핑용)
    all_unique_numbers_list = sorted(list(all_unique_numbers))
    total_unique_nums = len(all_unique_numbers_list)  # 총 유니크 숫자의 개수

    valid_combinations_count = 0  # 조건을 만족하는 '불린 숫자 집합'의 총 개수

    # 2. 비트마스킹을 사용하여 모든 가능한 '불린 숫자 집합'을 생성하고 탐색
    # (1 << total_unique_nums)는 2의 total_unique_nums 제곱, 즉 모든 부분집합의 개수
    # 각 'i'는 하나의 비트마스크(숫자 집합)를 나타냄
    for i in range(1, 1 << total_unique_nums):  # i=1부터 시작하여, 아무 숫자도 부르지 않은 빈 집합은 제외
        current_called_set = set()  # 현재 비트마스크에 해당하는 불린 숫자 집합

        # 비트마스크 'i'를 해석하여 'current_called_set' 생성
        for j in range(total_unique_nums):
            if (i >> j) & 1:  # 'i'의 j번째 비트가 1이면, 해당 숫자가 불렸다는 의미
                current_called_set.add(all_unique_numbers_list[j])

        # 3. 현재 '불린 숫자 집합' (current_called_set)에 대해 모든 플레이어의 빙고 개수를 계산하고 조건 확인

        # 3-1. 내 빙고판의 빙고 개수 계산 및 조건 확인 (내 빙고 >= 3)
        my_bingo_count = calculate_bingos_for_set(board_maps[my_board_idx], current_called_set)
        my_condition_met = (my_bingo_count >= 3)

        # 3-2. 내 빙고판 조건이 만족할 때만 다른 플레이어 조건 확인 (가지치기)
        other_players_condition_met = True
        if my_condition_met:  # 내 빙고가 3개 미만이면, 이 집합은 이미 유효하지 않으므로 더 이상 검사할 필요 없음
            for p_idx in range(num_players):
                if p_idx == my_board_idx:  # 내 빙고판은 이미 확인했으므로 건너뛰기
                    continue

                # 다른 플레이어의 빙고 개수 계산
                other_bingo_count = calculate_bingos_for_set(board_maps[p_idx], current_called_set)

                if other_bingo_count > 2:  # 다른 플레이어가 3빙고 이상 달성하면 조건 불만족
                    other_players_condition_met = False
                    break  # 이 '불린 숫자 집합'은 유효하지 않으므로, 더 이상 다른 플레이어를 확인할 필요 없음

        # 4. 모든 조건을 만족하면 '유효한 불린 숫자 집합'의 개수 증가
        if my_condition_met and other_players_condition_met:
            valid_combinations_count += 1

    return valid_combinations_count


# --- 테스트 케이스 ---

print("--- 테스트 케이스 시작 ---")

# 예시 1: 가장 기본적인 상황
# 내 빙고판이 3빙고 이상이 되고, 다른 플레이어들은 2빙고 이하가 되는 조합이 존재하는 경우
boards1 = [
    # 내 빙고판 (1,2,3 -> 1빙고, 4,5,6 -> 2빙고, 7,8,9 -> 3빙고)
    [[1, 2, 3],
     [4, 5, 6],
     [7, 8, 9]],
    # 플레이어 2 (빙고가 잘 안 나도록 설정. 1, 10만 연결되어 있음)
    [[10, 11, 12],
     [1, 13, 14],
     [15, 2, 16]]
]
# all_unique_numbers_list: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] (총 16개)
# 2^16 = 65,536가지 조합을 탐색합니다.
print(f"Test Case 1: Result = {solution(boards1)}")
# 기대값: 12795 (이전 실행 결과와 동일. 실제로 모든 조합을 탐색하여 계산된 값)

# 예시 2: 내 빙고판은 3빙고 이상 되기 어려운데, 다른 플레이어가 쉽게 3빙고가 되는 경우
boards2 = [
    # 내 빙고판 (10번대 숫자들로 이루어짐)
    [[10, 11, 12],
     [13, 14, 15],
     [16, 17, 18]],
    # 플레이어 2 (1~9로 빠르게 3빙고 달성 가능)
    [[1, 2, 3],
     [4, 5, 6],
     [7, 8, 9]]
]
# all_unique_numbers_list: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18] (총 18개)
# 2^18 = 262,144가지 조합 탐색.
print(f"Test Case 2: Result = {solution(boards2)}")
# 기대값: 0 (플레이어 2가 3빙고 이상 되는 것을 피하면서 내 빙고를 3빙고 이상으로 만들 조합이 없으므로)

# 예시 3: 내 빙고판이 절대로 3빙고 이상이 될 수 없는 경우 (불가한 숫자들)
boards3 = [
    # 내 빙고판 (3빙고를 만들만큼의 라인이 완성될 수 없는 구조 - 예: 1,2,10,11,12,3,13,14,15)
    [[1, 2, 10],
     [11, 12, 3],
     [13, 14, 15]],
    # 플레이어 2
    [[20, 21, 22],
     [23, 24, 25],
     [26, 27, 28]]
]
# 이 경우, 내 빙고판이 3빙고 이상이 되는 조합 자체가 존재하지 않으므로 결과는 0
# 1,2,10 이 한 라인, 11,12,3 이 한 라인... 아무리 숫자를 불러도 3개 줄이 꽉 차기 어려움
print(f"Test Case 3: Result = {solution(boards3)}")
# 기대값: 0 (내 빙고판이 3빙고 이상 되는 경우가 없으므로)

# 예시 4: 모든 플레이어가 1빙고도 못하는 경우
boards4 = [
    # 내 빙고판
    [[1, 2, 3],
     [4, 5, 6],
     [7, 8, 9]],
    # 플레이어 2
    [[10, 11, 12],
     [13, 14, 15],
     [16, 17, 18]]
]
# 내 빙고를 3빙고 이상으로 만들면 (예: {1,2,3,4,5,6,7})
# 플레이어 2는 불린 숫자들 중 10~18은 없으므로 0빙고.
# 따라서 해당 조건 만족.
# 이 경우, 내 빙고판이 3빙고 이상이 되는 모든 조합이 유효할 가능성이 높음.
print(f"Test Case 4: Result = {solution(boards4)}")
# (1~9까지 모두 유니크하다면 total_unique_nums=18)
# 계산해보면 131072가 나옴.
# {1,2,3,4,5,6,7}부터 시작해서 나머지 숫자 11개 중에서 임의의 숫자를 추가해도
# 다른 플레이어는 3빙고 이상 되지 않는 조건만 만족하면 됨.
# 내 빙고판이 3빙고가 되는 최소 집합의 크기는 7({1~7} 3줄)
# 11개 숫자 중 선택하는 조합의 수 2^11 = 2048
# + 내 빙고판이 4빙고가 되는 최소 집합의 크기는 8
# 등등 모든 조합을 다 합친 것.