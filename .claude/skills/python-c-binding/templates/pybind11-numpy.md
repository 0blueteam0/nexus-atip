# pybind11 NumPy 연동 템플릿

## 헤더 포함

```cpp
#include <pybind11/pybind11.h>
#include <pybind11/numpy.h>
#include <pybind11/stl.h>

namespace py = pybind11;
```

---

## 1D 배열 처리

```cpp
// 배열 요소별 연산
py::array_t<double> scale_array(py::array_t<double> input, double factor) {
    // 버퍼 정보 요청
    py::buffer_info buf = input.request();

    // 1D 배열 확인
    if (buf.ndim != 1) {
        throw std::runtime_error("Input must be 1-D array");
    }

    // 결과 배열 생성
    auto result = py::array_t<double>(buf.size);
    py::buffer_info result_buf = result.request();

    // 포인터 획득
    double *ptr_in = static_cast<double*>(buf.ptr);
    double *ptr_out = static_cast<double*>(result_buf.ptr);

    // 연산 수행
    for (size_t i = 0; i < buf.size; i++) {
        ptr_out[i] = ptr_in[i] * factor;
    }

    return result;
}
```

---

## 2D 배열 (행렬) 처리

```cpp
// 행렬 전치
py::array_t<double> transpose(py::array_t<double> input) {
    py::buffer_info buf = input.request();

    if (buf.ndim != 2) {
        throw std::runtime_error("Input must be 2-D array");
    }

    size_t rows = buf.shape[0];
    size_t cols = buf.shape[1];

    // 전치 결과 배열 생성
    auto result = py::array_t<double>({cols, rows});
    py::buffer_info result_buf = result.request();

    double *ptr_in = static_cast<double*>(buf.ptr);
    double *ptr_out = static_cast<double*>(result_buf.ptr);

    // 전치 연산
    for (size_t i = 0; i < rows; i++) {
        for (size_t j = 0; j < cols; j++) {
            ptr_out[j * rows + i] = ptr_in[i * cols + j];
        }
    }

    return result;
}
```

---

## In-place 연산

```cpp
// 입력 배열 직접 수정 (복사 없음)
void scale_inplace(py::array_t<double> arr, double factor) {
    py::buffer_info buf = arr.request();

    if (buf.readonly) {
        throw std::runtime_error("Array is read-only");
    }

    double *ptr = static_cast<double*>(buf.ptr);
    for (size_t i = 0; i < buf.size; i++) {
        ptr[i] *= factor;
    }
}
```

---

## 다중 반환값

```cpp
// 튜플로 여러 배열 반환
std::tuple<py::array_t<double>, py::array_t<double>>
split_array(py::array_t<double> input) {
    py::buffer_info buf = input.request();
    size_t half = buf.size / 2;

    auto first = py::array_t<double>(half);
    auto second = py::array_t<double>(buf.size - half);

    double *ptr_in = static_cast<double*>(buf.ptr);
    double *ptr_first = static_cast<double*>(first.request().ptr);
    double *ptr_second = static_cast<double*>(second.request().ptr);

    std::copy(ptr_in, ptr_in + half, ptr_first);
    std::copy(ptr_in + half, ptr_in + buf.size, ptr_second);

    return std::make_tuple(first, second);
}
```

---

## 타입별 처리 (템플릿)

```cpp
template <typename T>
py::array_t<T> add_arrays(py::array_t<T> a, py::array_t<T> b) {
    py::buffer_info buf_a = a.request();
    py::buffer_info buf_b = b.request();

    if (buf_a.size != buf_b.size) {
        throw std::runtime_error("Array sizes must match");
    }

    auto result = py::array_t<T>(buf_a.size);
    py::buffer_info result_buf = result.request();

    T *ptr_a = static_cast<T*>(buf_a.ptr);
    T *ptr_b = static_cast<T*>(buf_b.ptr);
    T *ptr_r = static_cast<T*>(result_buf.ptr);

    for (size_t i = 0; i < buf_a.size; i++) {
        ptr_r[i] = ptr_a[i] + ptr_b[i];
    }

    return result;
}

// 바인딩
PYBIND11_MODULE(example, m) {
    m.def("add_arrays_float", &add_arrays<float>);
    m.def("add_arrays_double", &add_arrays<double>);
    m.def("add_arrays_int", &add_arrays<int>);
}
```

---

## 모듈 바인딩 예시

```cpp
PYBIND11_MODULE(numpy_example, m) {
    m.doc() = "NumPy array operations";

    m.def("scale_array", &scale_array,
        "Scale array by factor",
        py::arg("input"), py::arg("factor"));

    m.def("transpose", &transpose,
        "Transpose 2D array",
        py::arg("input"));

    m.def("scale_inplace", &scale_inplace,
        "Scale array in-place",
        py::arg("arr"), py::arg("factor"));

    m.def("split_array", &split_array,
        "Split array into two halves",
        py::arg("input"));
}
```

---

## Python 사용 예시

```python
import numpy as np
import numpy_example as ne

# 1D 배열 스케일링
arr = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
scaled = ne.scale_array(arr, 2.0)
print(scaled)  # [2. 4. 6. 8. 10.]

# 행렬 전치
matrix = np.array([[1, 2, 3], [4, 5, 6]], dtype=np.float64)
transposed = ne.transpose(matrix)
print(transposed.shape)  # (3, 2)

# In-place 연산
arr2 = np.array([1.0, 2.0, 3.0])
ne.scale_inplace(arr2, 10.0)
print(arr2)  # [10. 20. 30.]

# 배열 분할
first, second = ne.split_array(np.array([1, 2, 3, 4, 5], dtype=np.float64))
print(first)   # [1. 2.]
print(second)  # [3. 4. 5.]
```

---

## 성능 팁

1. **버퍼 프로토콜 활용**: `request()`로 직접 메모리 접근
2. **복사 최소화**: `py::array_t<T, py::array::c_style>` 사용
3. **GIL 해제**: 긴 연산 시 `py::gil_scoped_release`
4. **SIMD 최적화**: 컴파일러 최적화 플래그 사용

```cpp
void long_computation(py::array_t<double> arr) {
    py::buffer_info buf = arr.request();
    double *ptr = static_cast<double*>(buf.ptr);

    // GIL 해제 (Python 호출 없는 순수 C++ 코드)
    {
        py::gil_scoped_release release;

        for (size_t i = 0; i < buf.size; i++) {
            // 긴 연산...
        }
    }
}
```
