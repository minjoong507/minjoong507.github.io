def findMedianSortedArrays(nums1, nums2):
    """
    :type nums1: List[int]
    :type nums2: List[int]
    :rtype: float
    """

    tgt = (len(nums1) + len(nums2)) // 2
    case = (len(nums1) + len(nums2)) % 2

    a = nums1.pop(0)
    b = nums2.pop(0)
    temp = []
    print(a, b)
    while True:
        if a < b:
            temp.append(a)
            if 0 < len(nums1):
                a = nums1.pop(0)
            else:
                temp.append(b)
                temp.extend(nums2)
                break
        else:
            temp.append(b)
            if 0 < len(nums2):
                b = nums2.pop(0)
            else:
                temp.append(a)
                temp.extend(nums1)
                break

        if tgt < len(temp):
            break

    print(temp, tgt, (len(nums1) + len(nums2)) % 2)

    if case == 0:
        return (temp[tgt-1] + temp[tgt - 2]) / 2
    else:
        return temp[tgt - 1]


print(findMedianSortedArrays([1, 2], [3,4]))