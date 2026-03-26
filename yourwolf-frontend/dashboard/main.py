import streamlit as st
import sys
import os
from enum import Enum

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.abilities import Ability
from app.card import Card

from app.definitions import AbilityType, AbilityPhase, Target, Team
from app.win import WinCondition

st.set_page_config(layout="wide")

card_creation, _, card = st.columns([2, 3, 4])




with card_creation:
    st.header("Card Creation")
    card_team = st.selectbox("Card Team", [team.value.title() for team in Team])
    if "win_conditions" not in st.session_state:
        st.session_state.win_conditions = 0

    def add_condition():
        st.session_state.win_conditions += 1
    for field_name, field in Card.model_fields.items():
    # If the field is a primitive, let's just assume it's not something that can be selected or changed
    # If it's a string, we'll deal with that on the card itself.

    st.button("Add Win Condition", on_click=add_condition)
    for i in range(st.session_state.win_conditions):
        cols = st.columns(
            len(WinCondition.model_fields) + 1
        )  # Adjust the number of columns for your layout
        for col, attribute in enumerate(WinCondition.model_fields):
            with cols[col]:
                st.selectbox(
                    label=f"{attribute}".title().replace("_", " "),
                    key=f"{attribute}{i+1}",
                    options=[
                        type_hint.value.title()
                        for type_hint in WinCondition.__annotations__[attribute]
                    ],
                )
        with cols[-1]:
            st.write("")
            st.write("")
            st.button(label="Remove", key=f"Remove {i+1}")
with card:
    card_center = st.columns([3,2,3])[1]
    with card_center:
        st.header("Card Preview")
        card_name = st.text_input("Card Name")
        card_description = st.text_area("Card Description")
