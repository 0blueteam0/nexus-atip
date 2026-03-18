---
name: python-c-binding
description: Python-C/C++ 바인딩 워크플로우 (pybind11 중심)
user-invocable: true
context: fork
memory: project
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
---

# Python-C Binding Skill

## 개요
Python에서 C/C++ 코드를 호출하기 위한 바인딩 생성 워크플로우입니다.
**pybind11**을 주력 도구로 사용하며, 상황에 따라 ctypes/CFFI를 보조적으로 활용합니다.

---

## 도구 선택 가이드

| 도구 | 적합한 상황 | 장점 | 단점 |
|------|------------|------|------|
| **pybind11** (권장) | C++ 라이브러리, 객체 지향 | 현대적 문법, NumPy 지원 | 컴파일 필요 |
| ctypes | 간단한 C 함수 | 순수 Python, 빌드 불필요 | 복잡한 구조체 어려움 |
| CFFI | PyPy 지원 필요 | ABI/API 모드, PyPy 호환 | 학습 곡선 |
| Cython | Python 확장 최적화 | 점진적 타이핑, 쉬운 시작 | 별도 언어 학습 |

---

## pybind11 워크플로우

### 1단계: 환경 설정

```bash
# pybind11 설치
pip install pybind11

# 또는 conda
conda install -c conda-forge pybind11

# 헤더 경로 확인
python -m pybind11 --includes
```

### 2단계: 기본 모듈 작성

```cpp
// example.cpp
#include <pybind11/pybind11.h>

namespace py = pybind11;

int add(int a, int b) {
    return a + b;
}

PYBIND11_MODULE(example, m) {
    m.doc() = "Example module";
    m.def("add", &add, "Add two numbers",
          py::arg("a"), py::arg("b"));
}
```

### 3단계: 빌드 설정

**setup.py 방식**:
```python
from setuptools import setup
from pybind11.setup_helpers import Pybind11Extension, build_ext

ext_modules = [
    Pybind11Extension(
        "example",
        ["example.cpp"],
    ),
]

setup(
    name="example",
    ext_modules=ext_modules,
    cmdclass={"build_ext": build_ext},
)
```

**CMake 방식**:
```cmake
cmake_minimum_required(VERSION 3.12)
project(example)

find_package(pybind11 REQUIRED)
pybind11_add_module(example example.cpp)
```

### 4단계: 빌드 및 테스트

```bash
# 빌드
pip install -e .

# 또는 CMake
mkdir build && cd build
cmake .. && make

# 테스트
python -c "import example; print(example.add(1, 2))"
```

---

## 고급 기능

### NumPy 배열 지원

```cpp
#include <pybind11/numpy.h>

py::array_t<double> multiply(py::array_t<double> input, double factor) {
    auto buf = input.request();
    auto result = py::array_t<double>(buf.size);
    auto result_buf = result.request();

    double *ptr_in = static_cast<double*>(buf.ptr);
    double *ptr_out = static_cast<double*>(result_buf.ptr);

    for (size_t i = 0; i < buf.size; i++) {
        ptr_out[i] = ptr_in[i] * factor;
    }

    return result;
}
```

### 클래스 바인딩

```cpp
class Pet {
public:
    Pet(const std::string &name) : name(name) {}
    void setName(const std::string &name_) { name = name_; }
    const std::string &getName() const { return name; }
private:
    std::string name;
};

PYBIND11_MODULE(example, m) {
    py::class_<Pet>(m, "Pet")
        .def(py::init<const std::string &>())
        .def("setName", &Pet::setName)
        .def("getName", &Pet::getName)
        .def_property("name", &Pet::getName, &Pet::setName);
}
```

### STL 컨테이너 변환

```cpp
#include <pybind11/stl.h>

std::vector<int> get_numbers() {
    return {1, 2, 3, 4, 5};
}

std::map<std::string, int> get_dict() {
    return {{"one", 1}, {"two", 2}};
}
```

---

## ctypes 폴백 가이드

**간단한 C 함수 호출 시**:

```python
import ctypes

# 라이브러리 로드
lib = ctypes.CDLL('./libexample.so')

# 함수 시그니처 정의
lib.add.argtypes = [ctypes.c_int, ctypes.c_int]
lib.add.restype = ctypes.c_int

# 호출
result = lib.add(1, 2)
```

---

## 디버깅 팁

### 컴파일 오류
```bash
# 상세 로그
pip install -e . -v

# 컴파일러 버전 확인
g++ --version
python -c "import sys; print(sys.version)"
```

### 런타임 오류
```python
# import 오류 확인
import sys
sys.path.insert(0, './build')

# 심볼 확인
import ctypes
lib = ctypes.CDLL('./example.cpython-310-x86_64-linux-gnu.so')
```

### 성능 프로파일링
```bash
# 시간 측정
python -m timeit "import example; example.compute()"

# 메모리 프로파일링
python -m memory_profiler script.py
```

---

## 체크리스트

### 시작 전
- [ ] C/C++ 컴파일러 설치 확인
- [ ] pybind11 설치
- [ ] Python 개발 헤더 설치

### 개발 중
- [ ] 함수 시그니처 명확히 정의
- [ ] 에러 핸들링 (예외 변환)
- [ ] 메모리 관리 확인 (소유권)

### 배포 전
- [ ] 다중 플랫폼 테스트
- [ ] wheel 빌드 (`pip wheel .`)
- [ ] 문서화 (docstring)

---

## 관련 파일

- `templates/pybind11-module.md`: 기본 모듈 템플릿
- `templates/pybind11-numpy.md`: NumPy 연동 템플릿
- `templates/CMakeLists-example.md`: CMake 빌드 템플릿

---

## 참조

- [pybind11 공식 문서](https://pybind11.readthedocs.io/)
- [pybind11 GitHub](https://github.com/pybind/pybind11)
- [NumPy C-API](https://numpy.org/doc/stable/reference/c-api/)

---

**버전**: 1.0.0
**작성일**: 2026-02-07
