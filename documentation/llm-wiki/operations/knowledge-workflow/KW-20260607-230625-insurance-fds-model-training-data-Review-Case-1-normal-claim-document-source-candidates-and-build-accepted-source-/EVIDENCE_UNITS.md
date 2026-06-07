# Evidence Units

## RED Case 1 registry

```
PYTHONPATH=. uv run --with pytest pytest tests/test_insurance_fds_case1_source_registry.py -q
ModuleNotFoundError: No module named 'scripts.insurance_fds_case1_source_registry'
```

## GREEN Case 1 registry

```
3 passed in 0.05s
```

## RED Case 3/5 contract

```
PYTHONPATH=. uv run --with pytest pytest tests/test_insurance_fds_case3_case5_contract.py -q
ModuleNotFoundError: No module named 'scripts.insurance_fds_case1_to_case3_case5_contract'
```

## GREEN / regression

```
PYTHONPATH=. uv run --with pytest --with pillow pytest tests/test_insurance_fds_case1_source_registry.py tests/test_insurance_fds_case3_case5_contract.py tests/test_insurance_fds_five_case_coverage.py tests/test_insurance_fds_four_case_coverage.py tests/test_insurance_fds_real_image_field_inventory.py tests/test_insurance_fds_real_image_pinpoint_overwrite.py -q
22 passed in 0.38s
```

## Created artifacts

- Case 1 reviewed source registry: data/insurance-fds-generated/five-case-dataset-ko/케이스1_정상_실손보험_청구문서_사진_수집/케이스1_정상청구문서_수집_공식출처_검토등록부_v0_1.ko.json
- Case 1 field inventory: data/insurance-fds-generated/five-case-dataset-ko/케이스1_정상_실손보험_청구문서_사진_수집/케이스1_정상청구문서_수집_필드인벤토리_v0_1.ko.json
- Case 3 target field contract: data/insurance-fds-generated/five-case-dataset-ko/케이스3_수집문서기반_AI코딩도구_국소위변조/케이스3_AI코딩도구_국소위변조_목표필드계약_v0_1.ko.json
- Case 5 generation schema: data/insurance-fds-generated/five-case-dataset-ko/케이스5_수집문서학습기반_LLM코딩도구_신규문서생성/케이스5_LLM코딩도구_신규문서생성_schema계약_v0_1.ko.json
