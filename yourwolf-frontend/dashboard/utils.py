import sys
import os
from enum import Enum
import re
from pydantic import BaseModel
from typing import Any

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from pydantic.fields import FieldInfo
from app.card import Card
from app.definitions import OrCondition

from typing import Optional, Union, get_origin, get_args, Type
import streamlit as st

primitives = (bool, str, int, float, type(None))


def modify_session_state_counter(key: str, value: int):
    if key not in st.session_state:
        print(f"Creating session state for {key}")
        st.session_state[key] = 0
    st.session_state[key] += value


def format_field_name(field_name: str):
    return " ".join(
        word.replace("_", " ").title()
        for word in re.sub(r"([A-Z])", r" \1", field_name).split()
    )


def display_enum_field(field_name: str, field: FieldInfo):
    st.selectbox(
        label=format_field_name(field_name),
        key=f"{field_name}",
        options=[type_hint.value.title() for type_hint in field.annotation],
    )


def display_enum_list_field(field_name: str, field: FieldInfo):
    st.multiselect(
        label=format_field_name(field_name),
        key=f"{field_name}",
        options=[type_hint.value.title() for type_hint in field.annotation],
    )


def is_list_or_dict(field: Any) -> Type:
    if hasattr(field, "__origin__"):
        if field.__origin__ == list:
            return list
        elif field.__origin__ == dict:
            return dict
    return field


def get_type_if_optional(field: Type) -> Type:
    args = get_args(field)
    if args:
        return [arg for arg in args if arg is not None][0]
    return field


def is_field_required(field_type: Type) -> bool:
    args = get_args(field_type)
    if args:  # This means it's either a union or a dictionary
        if None in args:
            return False
    return True


def create_single_enum_selector(
    field_name: str, field: Enum, field_required: bool = True
):
    print(f"Creating single select for {field_name}\n")
    if not field_required:
        field_values = [None] + [format_field_name(type_hint) for type_hint in field]
    else:
        field_values = [format_field_name(type_hint) for type_hint in field]
    st.selectbox(
        label=format_field_name(field_name),
        key=f"{field_name}",
        options=field_values,
    )


def create_enum_multi_select(field_name: str, field: Enum):
    print(f"Creating multi select for {field_name}\n")
    st.multiselect(
        label=format_field_name(field_name),
        key=f"{field_name}",
        options=[type_hint.value.title() for type_hint in field],
    )


def create_enum_interface(
    field_name: str, field: Enum, parent_is_iterable: bool, field_requied: bool = True
):
    if parent_is_iterable:
        create_enum_multi_select(field_name, field)
    else:
        create_single_enum_selector(field_name, field, field_requied)


def create_row_add_button(field_name: str):
    print(f"Adding a row button for {field_name}")
    st.button(
        f"Add {format_field_name(field_name)}",
        key=f"{field_name}",
        on_click=modify_session_state_counter,
        args=(f"{field_name}_counter", 1),
    )


def create_text_input(field_name: str):
    st.text_input(label=format_field_name(field_name), key=f"{field_name}")


def add_single_object(
    field_type: Type,
    field_name: str,
    required: bool = True,
    parent_is_list: bool = False,
    parent_is_dict: bool = False,
    suffix: str = ""
):
    if field_type == int:
        pass
    elif hasattr(field_type, "__origin__") and field_type.__origin__ == dict:
        handle_iterable(field_type, field_name, dict, required)
    elif hasattr(field_type, "__origin__") and field_type.__origin__ == list:
        handle_iterable(field_type, field_name, list, required)
    elif issubclass(field_type, Enum):
        create_enum_interface(field_name, field_type, False, required)
    elif issubclass(field_type, BaseModel):
        create_object_interface(field_type, parent_is_list, parent_is_dict, required, field_name)
    elif field_type == str:
        create_text_input(field_name)
    else:
        raise ValueError(f"Unknown field type: {field_type}")


def handle_iterable(
    field_type: Type,
    field_name: str,
    iterable_type: Type,
    is_required: bool = True,
    parent_is_iterable: bool = False,
):
    print(f"Handling iterable {field_name}, {field_type}")
    if iterable_type == dict:
        print(f"\nAdding a row button which will read {format_field_name(f"{field_name}_set")}")
        create_row_add_button(f"{field_name}_set")
    else:
        print(f"\nAdding a row button which will read {format_field_name(field_name)}")
        create_row_add_button(field_name)
    try:
        print(f"field_type[1]: {get_args(field_type)[1]}")
    except:
        print(f"field_type[1] failed. field_type[0]: {get_args(field_type)[0]}")
    if is_required: # and f"{field_name}_counter" not in st.session_state:
        print("Field is required")
        modify_session_state_counter(f"{field_name}_counter", 1)
    # else:
    print(f"Current counter is {st.session_state[f'{field_name}_counter']}")
    for j in range(st.session_state[f"{field_name}_counter"]):
        field_required = is_field_required(field_type)
        print(f"Iterating through j to range session state for {field_name}_{j} and type {field_type}")
        # with cols[j]:
        try:
            new_object_type = get_args(field_type)[1]
            if j > 0:
                st.write("OR")
            add_single_object(
                new_object_type,
                f"{field_name}_{j}",
                required=field_required,
                parent_is_list=True,
            )
        except:
            new_object_type = get_args(field_type)[0]
            if j >0:
                st.write("AND")
            add_single_object(
                new_object_type,
                f"{new_object_type}_{j}",
                required=field_required,
                parent_is_list=True,
            )

def handle_single_object_field(field_name: str, field: FieldInfo,  parent_is_list: bool, parent_is_dict: bool):
    parent_is_iterable = parent_is_list or parent_is_dict
    field_type = field.annotation
    field_required = field.is_required()
    if not field_required:
        field_type = get_args(field_type)[0]
    if field_type == int:
        return
    elif hasattr(field_type, "__origin__") and field_type.__origin__ == dict:
        print(f"Handling dict: {field_name} - move to handle iterable\n")
        handle_iterable(field_type, field_name, dict, field_required)
    elif hasattr(field_type, "__origin__") and field_type.__origin__ == list:
        print(f"Handling list: {field_name} - move to handle iterable\n")
        handle_iterable(field_type, field_name, list, field_required)
    elif issubclass(field_type, Enum):
        print(f"Handling enum: {field_name}")
        create_enum_interface(
            field_name,
            field_type,
            parent_is_iterable,
            field_required,
        )
    else:
        print(f"Handling single object: {field_name}\n")
        add_single_object(field_type, field_name)


def create_object_interface(
    model: BaseModel,
    parent_is_list: bool = False,
    parent_is_dict: bool = False,
    required: bool = True,
    name: str = None,
):
    # We need to know if the parent field is an iterable to determine if we need a multiselect (for enums)
    # the abilities to add multiple rows (for other types), or to just display the field as a single interface
    parent_is_iterable = parent_is_list or parent_is_dict

    # cols = st.columns(len(model.model_fields) + 1 + parent_is_iterable)
    print(f"\n\n{model} Starting\n\n")
    if parent_is_list:
        cols = st.columns(len(model.model_fields.items()))
    for i, field_info in enumerate(model.model_fields.items()):
        field_name = field_info[0]
        field_info = field_info[1]
        print(f"i :{i}, field name: {field_name}, field type: {field_info.annotation}")
        if parent_is_list:
            with cols[i]:
                handle_single_object_field(field_name, field_info, parent_is_list, parent_is_dict)
        else:
            handle_single_object_field(field_name, field_info, parent_is_list, parent_is_dict)
        # field_name = field_info[0]
        # field = field_info[1]
        # field_type = field.annotation
        # print(f"i :{i}, field name: {field_name}, field type: {field_type}")
        # field_required = field.is_required()
        # if not field_required:
        #     field_type = get_args(field_type)[0]
        # if field_type == int:
        #     continue
        # elif hasattr(field_type, "__origin__") and field_type.__origin__ == dict:
        #     print(f"Handling dict: {field_name} - move to handle iterable\n")
        #     handle_iterable(field_type, field_name, dict, field_required)
        # elif hasattr(field_type, "__origin__") and field_type.__origin__ == list:
        #     print(f"Handling list: {field_name} - move to handle iterable\n")
        #     handle_iterable(field_type, field_name, list, field_required)
        # elif issubclass(field_type, Enum):
        #     print(f"Handling enum: {field_name}")
        #     create_enum_interface(
        #         field_name,
        #         field_type,
        #         parent_is_iterable,
        #         field_required,
        #     )
        # else:
        #     print(f"Handling single object: {field_name}\n")
        #     add_single_object(field_type, field_name)


create_object_interface(Card)
